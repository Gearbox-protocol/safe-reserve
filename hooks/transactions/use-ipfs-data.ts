"use client";

import { instanceTxsSchema, timelockTxsSchema } from "@/utils/validation";
import { SafeTx } from "@gearbox-protocol/permissionless";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Address } from "viem";

interface IpfsTxs {
  chainId: number;
  author: Address;
}

export interface TimelockTxs extends IpfsTxs {
  type: "timelock";

  eta: number;
  marketConfigurator: Address;
  createdAtBlock: number;
  queueBatches: SafeTx[][];
}

export interface InstanceTxs extends IpfsTxs {
  type: "instance";

  instanceManager: Address;
  createdAtBlock?: number;
  batches: SafeTx[][];
}

async function fetchFromIPFS(cid: string): Promise<unknown> {
  // Build gateway URLs with proper path construction
  const gateways = [
    process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL
      ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL.replace(/\/$/, "")}/ipfs/${cid}`
      : null,
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
          Accept: "application/json, text/plain, */*",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch from ${gateway}: ${response.status} ${response.statusText}`
        );
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
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

function getTypedIPFSData(ipfsData: TimelockTxs | InstanceTxs | undefined) {
  if (ipfsData?.type === "timelock")
    return {
      type: ipfsData?.type,
      chainId: ipfsData?.chainId,
      author: ipfsData?.author,
      eta: ipfsData?.eta,
      marketConfigurator: ipfsData?.marketConfigurator,
      createdAtBlock: ipfsData?.createdAtBlock,
      batches: ipfsData?.queueBatches,
    };
  else
    return {
      type: ipfsData?.type,
      chainId: ipfsData?.chainId,
      author: ipfsData?.author,
      instanceManager: ipfsData?.instanceManager,
      batches: ipfsData?.batches,
      createdAtBlock: ipfsData?.createdAtBlock,
    };
}

export function useIpfsData(cid: string): {
  type?: "timelock" | "instance";
  chainId?: number;
  author?: Address;

  eta?: number;
  marketConfigurator?: Address;
  createdAtBlock?: number;
  batches?: SafeTx[][];

  instanceManager?: Address;

  isLoading: boolean;
  error: Error | null;
} {
  const {
    data: ipfsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ipfs-transactions", cid],
    queryFn: async () => {
      if (!cid) {
        throw new Error("Missing required parameters");
      }

      const data = await fetchFromIPFS(cid);
      try {
        const validatedData = timelockTxsSchema.parse(data);
        return { type: "timelock", ...validatedData } as TimelockTxs;
      } catch {
        const validatedData = instanceTxsSchema.parse(data);
        return { type: "instance", ...validatedData } as InstanceTxs;
      }
    },
    enabled: !!cid,
    retry: 3,
    staleTime: Infinity,
  });

  return {
    ...getTypedIPFSData(ipfsData),
    isLoading,
    error,
  };
}

export function useMultipleIpfsData(cids: string[]): {
  data: {
    type?: "timelock" | "instance";
    chainId?: number;
    author?: Address;

    eta?: number;
    marketConfigurator?: Address;
    createdAtBlock?: number;
    batches?: SafeTx[][];

    instanceManager?: Address;
  }[];

  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const result = useQueries({
    queries: cids.map((cid) => ({
      queryKey: ["ipfs-transactions", cid],
      queryFn: async () => {
        if (!cid) {
          throw new Error("Missing required parameters");
        }

        const data = await fetchFromIPFS(cid);
        try {
          const validatedData = timelockTxsSchema.parse(data);
          return { type: "timelock", ...validatedData } as TimelockTxs;
        } catch {
          const validatedData = instanceTxsSchema.parse(data);
          return { type: "instance", ...validatedData } as InstanceTxs;
        }
      },
      enabled: !!cid,
      retry: 3,
      staleTime: Infinity,
    })),
  });

  return {
    data: result.map(({ data }) => getTypedIPFSData(data)),
    isLoading: result.some(({ isLoading }) => isLoading),
    error: result.find(({ error }) => error)?.error || null,
    refetch: async () => {
      await Promise.all(result.map((r) => r.refetch()));
    },
  };
}
