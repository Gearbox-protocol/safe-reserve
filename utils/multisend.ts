import { Call } from "@/core/safe-tx";
import {
  AbiFunction,
  Address,
  decodeAbiParameters,
  decodeFunctionData,
  Hex,
  parseAbi,
} from "viem";
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

function json_stringify(obj: unknown): string {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  });
}

function parseHumanReadable(abi: string, data: Hex): [string, unknown[]] {
  const abiParsed = parseAbi([
    `function ${abi}` as unknown as string,
  ])[0] as AbiFunction;

  const params = decodeAbiParameters(abiParsed.inputs, data);

  if (abiParsed.inputs && abiParsed.inputs.length > 0) {
    return [
      abiParsed.name,
      params as unknown[],
      // params.map((value, i) =>
      //   abiParsed.inputs[i].type === "address"
      //     ? value
      //     : abiParsed.inputs[i].type.startsWith("tuple")
      //       ? json_stringify(value)
      //       : abiParsed.inputs[i].type === "bytes"
      //         ? (value as Hex).length > 50
      //           ? shortenHash(value as Hex, 40)
      //           : value
      //         : value
      // ) as string[],
    ];
  }
  return [abiParsed.name, []];
}

export function decodeTransactions(transactionsHex: Hex): Call[] {
  // Remove "0x" prefix if present
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

  // Helper to read a specific number of hex characters and advance our index
  function readHexChars(count: number): string {
    const slice = data.slice(index, index + count);
    index += count;
    return slice;
  }

  while (index < data.length) {
    // 1) operation (1 byte => 2 hex chars)
    const operationHex = readHexChars(2);
    const operation = parseInt(operationHex, 16);

    // Enforce that operation == 0
    if (operation !== 0) {
      throw new Error(`Forbidden operation: expected 0 but got ${operation}`);
    }

    // 2) 'to' address (20 bytes => 40 hex chars)
    const toHex = readHexChars(40);
    let to = "0x" + toHex;

    // 3) value (32 bytes => 64 hex chars)
    const valueHex = readHexChars(64);
    const value = "0x" + valueHex; // you can convert this to a BN/BigInt if needed

    // 4) data length (32 bytes => 64 hex chars)
    const dataLengthHex = readHexChars(64);
    const dataLength = parseInt(dataLengthHex, 16);

    // 5) data (dataLength bytes => dataLength * 2 hex chars)
    const callDataHex = readHexChars(dataLength * 2);
    const callData = "0x" + callDataHex;

    let functionName = "unknown";
    let functionArgs: unknown[] = [];

    let parsedFunctionName;
    let parsedFunctionArgs;

    // 0xf2b06537
    if (callData.toLowerCase().startsWith("0x3a66f901")) {
      const data = decodeFunctionData({
        abi: parseAbi([
          "function queueTransaction(address,uint256,string,bytes,uint256)",
        ]),
        data: callData as Hex,
      });

      // humanReadable = `queueTransaction(\nto: ${data.args[0]}, \nnonce: ${data.args[1]}, \nname: ${data.args[2]}, \ndata: ${shortenHash(data.args[3] as Hex, 10)}, \nvalue: ${data.args[4]})\n`;
      [parsedFunctionName, parsedFunctionArgs] = parseHumanReadable(
        data.args[2],
        data.args[3]
      );
      to = data.args[0];

      functionName = "queueTransaction";
      functionArgs = data.args as unknown as unknown[];
    } else {
      try {
        const data = decodeFunctionData({
          abi: parseAbi(["function startBatch(uint80)"]),
          data: callData as Hex,
        });
        functionName = "startBatch";
        functionArgs = data.args as unknown as unknown[];
      } catch {
        functionName = callData.slice(0, 10);
        functionArgs = [callData.slice(10)];
      }
    }

    // Push the transaction object without the 'operation' field
    decoded.push({
      to: to as Address,
      value: BigInt(value),
      data: callData as Hex,
      functionName,
      functionArgs,
      parsedFunctionName,
      parsedFunctionArgs,
    });
  }

  return decoded;
}
