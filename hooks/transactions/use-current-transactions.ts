"use client";

import { ExtendedSignedTx, ParsedSignedTx } from "@/core/safe-tx";
import { useIpfsData } from "@/hooks";
import { Address, Hex } from "viem";
import { useBlock } from "wagmi";
import { useGovernanceTransactions } from "./use-governance-transactions";
import { useInstanceTransactions } from "./use-instance-transactions";

interface CurrentTransactions {
  safe?: Address;
  createdAt?: number;
  isLoading: boolean;
  error: Error | null;
  refetchSigs: () => Promise<unknown>;
}

export interface CurrentGovernorTransactions extends CurrentTransactions {
  type: "timelock";

  txs: ParsedSignedTx[];
  governor?: Address;
}

export interface CurrentInstanceTransactions extends CurrentTransactions {
  type: "instance";

  txs: ExtendedSignedTx[];
  isExecuted?: boolean;
  executedTxHash?: Hex;
  instanceManager?: Address;
}

export function useCurrentTransactions(
  cid: string,
  useNonce?: number
): CurrentGovernorTransactions | CurrentInstanceTransactions {
  const {
    chainId,
    type,
    eta,
    createdAtBlock,
    batches,
    updatableFeeds,
    marketConfigurator,
    instanceManager,
    isLoading: isLoadingIpfsData,
    error: errorIpfsData,
  } = useIpfsData(cid);

  const {
    txs: governorTxs,
    safe: governorSafe,
    governor,
    isLoading: isLoadingGovernorTxs,
    error: errorGovernorTxs,
    refetchSigs: refetchGovernorSigs,
  } = useGovernanceTransactions({
    cid,
    chainId,
    marketConfigurator,
    eta,
    queueBatches: batches,
    createdAtBlock,
    updatableFeeds,
  });

  const {
    txs: instanceTxs,
    safe: instanceSafe,
    isLoading: isLoadingInstanceTxs,
    isExecuted,
    executedTxHash,
    error: errorInstanceTxs,
    refetchSigs: refetchInstanceSigs,
  } = useInstanceTransactions({
    cid,
    chainId,
    instanceManager,
    batches,
    createdAtBlock,
    useNonce,
    updatableFeeds,
  });

  const { data: createdAt, isLoading: isLoadingCreatedAt } = useBlock({
    chainId,
    blockNumber: BigInt(createdAtBlock ?? 0),
    query: {
      enabled: !!createdAtBlock,
      select: (block) =>
        createdAtBlock === undefined ? undefined : Number(block.timestamp),
    },
  });

  if (type === "instance")
    return {
      type,
      createdAt,
      txs: instanceTxs,
      safe: instanceSafe,
      isExecuted,
      instanceManager,
      executedTxHash,
      isLoading:
        isLoadingIpfsData || isLoadingInstanceTxs || isLoadingCreatedAt,
      error: errorIpfsData || errorInstanceTxs,
      refetchSigs: refetchInstanceSigs,
    };

  return {
    type: "timelock",
    createdAt,
    txs: governorTxs,
    safe: governorSafe,
    governor,
    isLoading: isLoadingIpfsData || isLoadingGovernorTxs || isLoadingCreatedAt,
    error: errorIpfsData || errorGovernorTxs,
    refetchSigs: refetchGovernorSigs,
  };
}
