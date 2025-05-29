"use client";

import testJson from "@/test-txs.json";

import { useQuery } from "@tanstack/react-query";

import { Address } from "viem";
import { usePublicClient } from "wagmi";

export function useMarketConfiguratorInfo(cid: string): {
  chainId?: number;
  marketConfigurator?: Address;
  safeAddress?: Address;
  timelockAddress?: Address;
  governorAddress?: Address;
  isLoading: boolean;
  error: Error | null;
} {
  const publicClient = usePublicClient();

  const {
    data: ipfsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ipfs-transactions", cid],
    queryFn: async () => {
      if (!cid || !publicClient) {
        throw new Error("Missing required parameters");
      }

      // TODO: fetch txs from ipfs
      const txs = testJson;

      return txs;
    },
    enabled: !!cid && !!publicClient,
    retry: 3,
  });

  return {
    // TODO:
    chainId: 1,
    marketConfigurator: ipfsData?.marketConfigurator as Address | undefined,
    isLoading,
    error,
  };
}
