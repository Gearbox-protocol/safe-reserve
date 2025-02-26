"use client";

import reserveJson from "@/reserve-upload.json";
import reserveJson2 from "@/reserve-upload_214.json";
import { useQuery } from "@tanstack/react-query";

import { safeAbi } from "@/bindings/generated";
import { SafeTx } from "@/core/safe-tx";
import { useSafeParams } from "@/hooks/use-safe-params";
import { decodeTransactions } from "@/utils/multisend";
import { Address, decodeFunctionData, Hex, parseAbi } from "viem";
import { usePublicClient } from "wagmi";

export function useCurrentTransactions(safeAddress: Address): {
  txs: SafeTx[];
  isLoading: boolean;
  error: Error | null;
} {
  const publicClient = usePublicClient();
  const { signers, nonce } = useSafeParams(safeAddress);

  const {
    data: txs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["current-transactions"],
    queryFn: async () => {
      if (!safeAddress || !publicClient || !signers || nonce === undefined) {
        throw new Error("Missing required parameters");
      }
      const txs = [...reserveJson, ...reserveJson2]
        .filter((t) => t.safe.toLowerCase() === safeAddress.toLowerCase())
        .filter((t) => t.nonce >= nonce);

      const readyTxs: SafeTx[] = [];

      for (const tx of txs) {
        const signedBy = await Promise.all(
          signers.map((signer) =>
            publicClient.readContract({
              address: safeAddress,
              abi: safeAbi,
              functionName: "approvedHashes",
              args: [signer, tx.hash as Hex],
            })
          )
        );
        readyTxs.push({
          ...tx,
          to: tx.to as Address,
          value: BigInt(tx.value),
          data: tx.data as Hex,
          operation: tx.operation,
          safeTxGas: BigInt(tx.safeTxGas),
          baseGas: BigInt(tx.baseGas),
          gasPrice: BigInt(tx.gasPrice),
          gasToken: tx.gasToken as Address,
          refundReceiver: tx.refundReceiver as Address,
          nonce: BigInt(tx.nonce),
          hash: tx.hash as Hex,
          signedBy: [
            ...(signers.filter((_, index) => signedBy[index] > 0) as Address[]),
          ],
          calls: decodeTransactions(tx.data as Hex),
        });
      }

      const functionSignatures = new Set<string>();

      for (const tx of readyTxs) {
        for (const call of tx.calls) {
          const functionSignature = call.data.slice(0, 10);
          if (functionSignature.toLowerCase() === "0x3a66f901") {
            const data = decodeFunctionData({
              abi: parseAbi([
                "function queueTransaction(address,uint256,string,bytes,uint256)",
              ]),
              data: call.data,
            });
            const internalTx = data.args[3] as Hex;

            functionSignatures.add(internalTx.slice(0, 10));
          }
          functionSignatures.add(functionSignature);
        }
      }

      return readyTxs;
    },
    enabled:
      !!safeAddress && !!publicClient && !!signers && nonce !== undefined,
    retry: 3,
  });
  return {
    txs: txs || [],
    isLoading,
    error: error as Error | null,
  };
}
