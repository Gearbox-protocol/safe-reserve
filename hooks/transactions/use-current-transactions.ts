"use client";

import { ParsedSignedTx, SignedTx } from "@/core/safe-tx";
import { useIpfsData } from "@/hooks";
import { Address } from "viem";
import { useGovernanceTransactions } from "./use-governance-transactions";
import { useInstanceTransactions } from "./use-instance-transactions";

interface CurrentTransactions {
  safe?: Address;
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

  txs: SignedTx[];
  instanceManager?: Address;
}

export function useCurrentTransactions(
  cid: string
): CurrentGovernorTransactions | CurrentInstanceTransactions {
  const {
    chainId,
    type,
    marketConfigurator,
    eta,
    batches,
    instanceManager,
    createdAtBlock,
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
  });

  const {
    txs: instanceTxs,
    safe: instanceSafe,
    isLoading: isLoadingInstanceTxs,
    error: errorInstanceTxs,
    refetchSigs: refetchInstanceSigs,
  } = useInstanceTransactions({
    cid,
    chainId,
    instanceManager,
    batches,
  });

  if (type === "instance")
    return {
      type,
      txs: instanceTxs,
      safe: instanceSafe,
      instanceManager,
      isLoading: isLoadingIpfsData || isLoadingInstanceTxs,
      error: errorIpfsData || errorInstanceTxs,
      refetchSigs: refetchInstanceSigs,
    };

  return {
    type: "timelock",
    txs: governorTxs,
    safe: governorSafe,
    governor,
    isLoading: isLoadingIpfsData || isLoadingGovernorTxs,
    error: errorIpfsData || errorGovernorTxs,
    refetchSigs: refetchGovernorSigs,
  };
}
