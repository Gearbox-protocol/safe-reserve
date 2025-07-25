"use client";

import { timelockTxsSchema } from "@/utils/validation";
import { SafeTx } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address, Hex } from "viem";
import { usePublicClient } from "wagmi";

export interface TimelockTxs {
  chainId: number;
  eta: number;
  author: Address;
  marketConfigurator: Address;
  createdAtBlock: number;
  queueBatches: SafeTx[][];
}

export interface SignedTimelockTxs extends TimelockTxs {
  signature: Hex;
}

async function fetchFromIPFS(cid: string): Promise<unknown> {
  // Build gateway URLs with proper path construction
  const gateways = [
    process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL ? 
      `${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL.replace(/\/$/, '')}/ipfs/${cid}` : null,
    `https://ipfs.io/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://${cid}.ipfs.dweb.link`,
  ].filter((gateway): gateway is string => gateway !== null);

  let lastError: Error | null = null;

  for (const gateway of gateways) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(gateway, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch from ${gateway}: ${response.status} ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        // Handle non-JSON responses (some gateways return plain text)
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Invalid JSON response from ${gateway}`);
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Failed to fetch from ${gateway}:`, error);
      // Continue to next gateway
    }
  }

  throw lastError || new Error("All IPFS gateways failed");
}

export function useIpfsData(cid: string): {
  chainId?: number;
  eta?: number;
  marketConfigurator?: Address;
  author?: Address;
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

      const data = await fetchFromIPFS(cid);
      const validatedData = timelockTxsSchema.parse(data);
      return validatedData as SignedTimelockTxs;
    },
    enabled: !!cid && !!publicClient,
    retry: 3,
  });

  return {
    chainId: ipfsData?.chainId,
    eta: ipfsData?.eta,
    marketConfigurator: ipfsData?.marketConfigurator,
    author: ipfsData?.author,
    createdAtBlock: ipfsData?.createdAtBlock,
    queueBatches: ipfsData?.queueBatches,
    signature: ipfsData?.signature,
    isLoading,
    error,
  };
}
