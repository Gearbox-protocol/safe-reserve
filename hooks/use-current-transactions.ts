"use client";

import { useQuery } from "@tanstack/react-query";

import { safeStorageAbi } from "@/bindings/generated";
import { SafeTx } from "@/core/safe-tx";
import { SAFE_STORAGE_ADDRESS } from "@/utils/constant";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

export function useCurrentTransactions(safeAddress: Address): {
  txs: SafeTx[];
  isLoading: boolean;
  error: Error | null;
} {
  const publicClient = usePublicClient();

  console.log("CURRENT CHAIN", publicClient?.chain);
  console.log("CURRENT SAFE ADDRESS", safeAddress);
  const {
    data: txs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["current-transactions"],
    queryFn: async () => {
      if (!safeAddress || !publicClient) {
        throw new Error("Not connected or contract not initialized");
      }

      try {
        const txs = await publicClient.readContract({
          address: SAFE_STORAGE_ADDRESS,
          abi: safeStorageAbi,
          functionName: "getQueuedTxs",
          args: [safeAddress],
        });
        return txs;
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(
            `Failed to fetch current transactions: ${err.message}`
          );
        }
        throw new Error(
          "An unknown error occurred while fetching current transactions"
        );
      }
    },
    enabled: !!safeAddress,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  return {
    txs: [...(txs || [])].map((tx) => ({
      ...tx,
      signedBy: [...tx.signedBy], // Convert readonly array to mutable array
      calls: [],
    })),
    isLoading,
    error: error as Error | null,
  };
}
