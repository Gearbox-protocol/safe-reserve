"use client";

import { safeAbi } from "@/abi";
import { SignedTx } from "@/core/safe-tx";
import { useSafeAddress, useSafeParams } from "@/hooks";
import {
  decodeMultisendTransactions,
  getReserveMultisigBatch,
} from "@/utils/multisend";
import { SafeTx } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address, Hex } from "viem";
import { usePublicClient } from "wagmi";

export function useInstanceTransactions({
  cid,
  chainId,
  batches,
  instanceManager,
}: {
  cid: string;
  chainId?: number;
  instanceManager?: Address;
  batches?: SafeTx[][];
}): {
  txs: SignedTx[];
  safe?: Address;
  isLoading: boolean;
  error: Error | null;
  refetchSigs: () => Promise<unknown>;
} {
  const publicClient = usePublicClient({ chainId });

  const {
    safe,
    isLoading: isLoadingSafe,
    error: errorSafe,
  } = useSafeAddress(chainId, instanceManager);

  const { nonce, signers } = useSafeParams(chainId, safe);

  const {
    data: preparedTxs,
    isLoading: isLoadingPreparedTxs,
    error: errorPreparedTxs,
  } = useQuery({
    queryKey: ["prepared-batches", cid],
    queryFn: async () => {
      if (!publicClient || !safe || nonce === undefined) return;

      // @note currently txs are not batched (batches.len === 1)
      // TODO: somehow add checker is batch executed or not

      const startIndex = -1;

      return await Promise.all(
        (batches ?? []).map((batch, index) =>
          getReserveMultisigBatch({
            type: "queue",
            client: publicClient,
            safeAddress: safe,
            batch: batch as SafeTx[],
            nonce:
              startIndex === -1
                ? Number(nonce) + index
                : Number(nonce) + index - startIndex,
          })
        )
      );
    },
    enabled: !!cid && !!publicClient && !!safe && nonce !== undefined,
    retry: 3,
  });

  const {
    data: txs,
    isLoading: isLoadingTxs,
    error: errorTxs,
    refetch,
  } = useQuery({
    queryKey: ["current-transactions", cid],
    queryFn: async () => {
      if (
        !safe ||
        !publicClient ||
        !signers ||
        !preparedTxs ||
        nonce === undefined
      )
        return;

      const readyTxs: SignedTx[] = [];

      for (const tx of preparedTxs) {
        const signedBy = await Promise.all(
          signers.map((signer) =>
            publicClient.readContract({
              address: safe,
              abi: safeAbi,
              functionName: "approvedHashes",
              args: [signer, tx.hash as Hex],
            })
          )
        );
        readyTxs.push({
          ...tx,
          to: tx.to as Address,
          value: BigInt(tx.value),
          data: tx.data as Hex,
          operation: tx.operation,
          safeTxGas: BigInt(tx.safeTxGas),
          baseGas: BigInt(tx.baseGas),
          gasPrice: BigInt(tx.gasPrice),
          gasToken: tx.gasToken as Address,
          refundReceiver: tx.refundReceiver as Address,
          nonce: BigInt(tx.nonce),
          hash: tx.hash as Hex,
          signedBy: [
            ...(signers.filter((_, index) => signedBy[index] > 0) as Address[]),
          ],
          calls: decodeMultisendTransactions(tx.data as Hex),
        });
      }

      return readyTxs;
    },
    enabled:
      !!cid &&
      !!publicClient &&
      !!signers &&
      !!safe &&
      !!preparedTxs &&
      nonce !== undefined,
    retry: 3,
  });

  return {
    txs: txs ?? [],
    safe: safe,
    isLoading: isLoadingSafe || isLoadingTxs || isLoadingPreparedTxs,
    error: errorSafe || errorTxs || errorPreparedTxs,
    refetchSigs: refetch,
  };
}
