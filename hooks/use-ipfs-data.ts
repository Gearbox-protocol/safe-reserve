"use client";

import { SafeTx } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address, Hex } from "viem";
import { usePublicClient } from "wagmi";
import { timelockTxsSchema } from "../utils/validation";

export interface TimelockTxs {
  chainId: number;
  eta: number;
  createdAtBlock: number;
  queueBatches: SafeTx[][];
  executeBatches: SafeTx[][];
  marketConfigurator: Address;
}

export interface SignedTimelockTxs extends TimelockTxs {
  signature: Hex;
}

export function useIpfsData(cid: string): {
  chainId?: number;
  marketConfigurator?: Address;
  eta?: number;
  createdAtBlock?: number;
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
      const validatedData = timelockTxsSchema.parse(data);
      return validatedData as SignedTimelockTxs;
    },
    enabled: !!cid && !!publicClient,
    retry: 3,
  });

  return {
    chainId: ipfsData?.chainId,
    marketConfigurator: ipfsData?.marketConfigurator as Address | undefined,
    eta: ipfsData?.eta,
    createdAtBlock: ipfsData?.createdAtBlock,
    queueBatches: ipfsData?.queueBatches as SafeTx[][] | undefined,
    signature: ipfsData?.signature,
    isLoading,
    error,
  };
}
