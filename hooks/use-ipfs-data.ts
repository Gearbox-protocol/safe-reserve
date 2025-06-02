"use client";

import { SafeTx } from "@gearbox-protocol/permissionless";

import { useQuery } from "@tanstack/react-query";

import { Address } from "viem";
import { usePublicClient } from "wagmi";

export function useIpfsData(cid: string): {
  chainId?: number;
  marketConfigurator?: Address;
  eta?: number;
  queueBatches?: SafeTx[][];
  signature?: string;
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

      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS data: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    enabled: !!cid && !!publicClient,
    retry: 3,
  });

  return {
    chainId: ipfsData?.chainId,
    marketConfigurator: ipfsData?.marketConfigurator as Address | undefined,
    eta: ipfsData?.eta,
    queueBatches: ipfsData?.queueBatches as SafeTx[][] | undefined,
    signature: ipfsData?.signature,
    isLoading,
    error,
  };
}
