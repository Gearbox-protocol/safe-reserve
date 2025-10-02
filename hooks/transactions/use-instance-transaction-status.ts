"use client";

import { useSafeAddress, useSafeParams } from "@/hooks";
import { getReserveMultisigBatch } from "@/utils/multisend";
import { executedSafeTxs } from "@/utils/tx-status";
import { SafeTx } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address, Hex } from "viem";
import { usePublicClient } from "wagmi";

export function useInstanceTransactionExecuted({
  cid,
  chainId,
  batches,
  instanceManager,
  createdAtBlock,
}: {
  cid: string;
  chainId?: number;
  instanceManager?: Address;
  batches?: SafeTx[][];
  createdAtBlock?: number;
}): {
  isExecuted?: boolean;
  nonce?: number;
  isLoading: boolean;
  error: Error | null;
} {
  const publicClient = usePublicClient({ chainId });

  const {
    safe,
    isLoading: isLoadingSafe,
    error: errorSafe,
  } = useSafeAddress(chainId, instanceManager);

  const { nonce, signers } = useSafeParams(chainId, safe);

  const {
    data: status,
    isLoading: isLoadingStatus,
    error: errorStatus,
  } = useQuery({
    queryKey: ["is-executed", cid],
    queryFn: async () => {
      if (!safe || !publicClient || !signers || nonce === undefined) return;

      const executedTxs = (
        await executedSafeTxs({
          publicClient,
          safe,
          createdAtBlock,
        })
      ).map((tx) => tx.toLowerCase() as Hex);

      const nonces = executedTxs.map((_, index) => Number(nonce) - index - 1);
      const preparedTxMap = await Promise.all(
        nonces.map((nonce) =>
          getReserveMultisigBatch({
            type: "queue",
            client: publicClient,
            safeAddress: safe,
            batch: batches![0] as SafeTx[],
            nonce: nonce,
          })
        )
      );

      for (const [index, tx] of preparedTxMap.entries()) {
        if (executedTxs.includes(tx.hash.toLowerCase() as Hex)) {
          return { isExecuted: true, nonce: nonces[index] };
        }
      }

      return { isExecuted: false };
    },
    enabled:
      !!cid && !!publicClient && !!signers && !!safe && nonce !== undefined,
    retry: 3,
  });

  return {
    isExecuted: status?.isExecuted,
    nonce: status?.nonce,
    isLoading: isLoadingSafe || isLoadingStatus,
    error: errorSafe || errorStatus,
  };
}
