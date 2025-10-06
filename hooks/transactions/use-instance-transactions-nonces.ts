"use client";

import {
  InstanceTxs,
  useMultipleIpfsData,
  useSafeAddress,
  useSafeParams,
} from "@/hooks";
import { useMemo } from "react";
import { Address } from "viem";
import { useInstanceTransactionsExecuted } from "./use-instance-transaction-status";

export function useInstanceTransactionNonces({
  cids,
  chainId,
  instanceManager,
}: {
  cids: string[];
  chainId: number;
  instanceManager: Address;
}): {
  nonces?: number[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading } = useMultipleIpfsData(cids);

  const preparedIPFSData = useMemo(() => {
    const filteredData = (data || [])
      .map((item, index) => ({ index, cid: cids[index], item: item }))
      .filter(({ item }) => item?.type === "instance") as Array<{
      index: number;
      cid: string;
      item: InstanceTxs;
    }>;

    const preparedIPFSData: Array<{
      index: number;
      cid: string;
      item: InstanceTxs;
    }> = [];
    const seen = new Set<string>();

    for (const entry of filteredData) {
      if (!seen.has(entry.cid.toLowerCase())) {
        seen.add(entry.cid.toLowerCase());

        if (
          entry.item.chainId === chainId &&
          entry.item.instanceManager?.toLowerCase() ===
            instanceManager.toLowerCase()
        ) {
          preparedIPFSData.push(
            entry as { index: number; cid: string; item: InstanceTxs }
          );
        }
      }
    }

    return preparedIPFSData;
  }, [data, chainId, instanceManager, cids]);

  const {
    safe,
    isLoading: isLoadingSafe,
    error: errorSafe,
  } = useSafeAddress(chainId, instanceManager);

  const {
    nonce: safeCurrentNonce,
    isLoading: isLoadingNonce,
    error: errorNonce,
  } = useSafeParams(chainId, safe);

  const {
    data: executedStatuses,
    isLoading: isLoadingExecuted,
    error: errorExecuted,
  } = useInstanceTransactionsExecuted({
    cids: preparedIPFSData.map(({ cid }) => cid),
    chainId: chainId,
    batches: preparedIPFSData.map(({ item }) => item.batches),
    instanceManager: instanceManager,
    createdAtBlock: preparedIPFSData.map(({ item }) => item.createdAtBlock),
  });

  const result = useMemo(() => {
    if (isLoadingSafe || isLoadingNonce || isLoadingExecuted) return undefined;

    if (!preparedIPFSData || preparedIPFSData.length === 0) {
      return new Array(cids.length).fill(0) as number[];
    }

    const out = new Array(cids.length).fill(0) as number[];

    const statuses = (executedStatuses ?? []) as Array<
      | { isExecuted: true; nonce: number }
      | { isExecuted: false; nonce?: undefined }
      | undefined
    >;

    const base = Number(safeCurrentNonce ?? 0);
    let counter = 0;

    preparedIPFSData.forEach(({ index: originalIdx }, localIdx) => {
      if (statuses[localIdx]?.isExecuted) {
        out[originalIdx] = Number(statuses[localIdx].nonce);
      } else {
        out[originalIdx] = base + counter;
        counter += 1;
      }
    });

    return out;
  }, [
    cids.length,
    preparedIPFSData,
    executedStatuses,
    safeCurrentNonce,
    isLoadingSafe,
    isLoadingNonce,
    isLoadingExecuted,
  ]);

  return {
    nonces: result,
    isLoading:
      isLoading || isLoadingSafe || isLoadingNonce || isLoadingExecuted,
    error: errorSafe || errorNonce || errorExecuted || null,
  };
}
