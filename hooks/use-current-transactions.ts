"use client";

import reserveJson from "@/reserve-upload.json";
import reserveJson2 from "@/reserve-upload_vanok.json";
import { useQuery } from "@tanstack/react-query";

import { safeAbi } from "@/bindings/generated";
import { SafeTx } from "@/core/safe-tx";
import { useSafeParams } from "@/hooks/use-safe-params";
import { decodeTransactions } from "@/utils/multisend";
import { Address, Hex } from "viem";
import { usePublicClient } from "wagmi";
export function useCurrentTransactions(safeAddress: Address): {
  txs: SafeTx[];
  isLoading: boolean;
  error: Error | null;
} {
  const publicClient = usePublicClient();
  const { signers, nonce } = useSafeParams(safeAddress);

  console.log("CURRENT CHAIN", publicClient?.chain);
  console.log("CURRENT SAFE ADDRESS", safeAddress);
  const {
    data: txs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["current-transactions"],
    queryFn: async () => {
      if (!safeAddress || !publicClient || !signers || !nonce) {
        throw new Error("Not connected or contract not initialized");
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
          signedBy: signers.filter(
            (_, index) => signedBy[index] > 0
          ) as Address[],
        });
      }
      return readyTxs;
    },
    enabled: !!safeAddress,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  return {
    txs: [...(txs || [])].map((tx) => ({
      ...tx,
      signedBy: [...tx.signedBy], // Convert readonly array to mutable array
      calls: decodeTransactions(tx.data),
    })),
    isLoading,
    error: error as Error | null,
  };
}
