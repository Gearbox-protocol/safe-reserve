import { Call, SignedTx } from "@/core/safe-tx";
import { json_parse } from "@gearbox-protocol/sdk";
import {
  convertQueueBatchToExecuteTx,
  SafeTx,
} from "@gearbox-protocol/sdk/permissionless";
import {
  Address,
  decodeFunctionData,
  encodeFunctionData,
  encodePacked,
  Hex,
  parseAbi,
  PublicClient,
  zeroAddress,
} from "viem";

export const MULTISEND: Address = "0x40a2accbd92bca938b02010e17a5b8929b49130d";

export async function getReserveMultisigBatch(args: {
  client: PublicClient;
  safeAddress: Address;
  batch: SafeTx[];
  nonce: number;
  type: "queue" | "execute";
}): Promise<SignedTx> {
  const { client, safeAddress, batch, nonce, type } = args;
  const txs = type === "queue" ? batch : [convertQueueBatchToExecuteTx(batch)];

  const multiSendData = txs
    .map((tx) => {
      const abi = [{ ...tx.contractMethod, outputs: [], type: "function" }];
      const functionName = tx.contractMethod.name;

      const args = tx.contractMethod.inputs.map((input) => {
        const arg = tx.contractInputsValues[input.name];

        try {
          return json_parse(arg);
        } catch {
          return arg;
        }
      });

      const data = encodeFunctionData({
        abi,
        functionName,
        args,
      });

      return encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [
          0,
          tx.to as Address,
          BigInt(tx.value),
          BigInt(data.replace("0x", "").length / 2),
          data,
        ]
      ).replace("0x", "");
    })
    .join("");

  const multisendCall = encodeFunctionData({
    abi: parseAbi(["function multiSend(bytes memory transactions)"]),
    functionName: "multiSend",
    args: [`0x${multiSendData}`],
  });

  const tx = {
    safe: safeAddress,
    to: MULTISEND,
    value: 0n,
    data: multisendCall,
    operation: 1,
    safeTxGas: 0n,
    baseGas: 0n,
    gasPrice: 0n,
    gasToken: zeroAddress,
    refundReceiver: zeroAddress,
    nonce: BigInt(nonce),
    hash: "0x" as Hex,
    signedBy: [],
    calls: [],
  };

  const dataHash = (await client.readContract({
    address: safeAddress,
    abi: parseAbi([
      "function getTransactionHash(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,uint256) returns (bytes32)",
    ]),
    functionName: "getTransactionHash",
    args: [
      tx.to,
      tx.value,
      tx.data,
      tx.operation,
      tx.safeTxGas,
      tx.baseGas,
      tx.gasPrice,
      tx.gasToken,
      tx.refundReceiver,
      BigInt(tx.nonce),
    ],
  })) as Hex;

  tx.hash = dataHash as Hex;

  return tx;
}

/**
 * Decodes transactions from a single hex string, where each transaction is encoded as:
 *   1) operation (1 byte, must be 0 in this version),
 *   2) to (20 bytes),
 *   3) value (32 bytes),
 *   4) data length (32 bytes),
 *   5) data (data length bytes).
 *
 * NOTE: This version omits the `operation` field in the returned objects
 *       and enforces that operation == 0 (i.e., no DELEGATECALL).
 *
 * @param transactionsHex The hex string containing the packed transactions.
 *                        (Should NOT include a function selector at the front.)
 */
export function decodeMultisendTransactions(transactionsHex: Hex): Call[] {
  const rawData = transactionsHex.startsWith("0x")
    ? transactionsHex
    : `0x${transactionsHex}`;

  const { args } = decodeFunctionData({
    abi: parseAbi(["function multiSend(bytes memory transactions)"]),
    data: rawData as Hex,
  });

  const data = args[0].slice(2);

  let index = 0;
  const decoded = [];

  function readHexChars(count: number): string {
    const slice = data.slice(index, index + count);
    index += count;
    return slice;
  }

  while (index < data.length) {
    const operationHex = readHexChars(2);
    const operation = parseInt(operationHex, 16);

    if (operation !== 0) {
      throw new Error(`Forbidden operation: expected 0 but got ${operation}`);
    }

    const to = "0x" + readHexChars(40);
    const value = "0x" + readHexChars(64);
    const dataLength = parseInt(readHexChars(64), 16);
    const callData = "0x" + readHexChars(dataLength * 2);

    decoded.push({
      to: to as Address,
      value: BigInt(value),
      data: callData as Hex,
    });
  }

  return decoded;
}
