"use client";

import { safeAbi } from "@/abi";
import { ExtendedSignedTx, SignedTx } from "@/core/safe-tx";
import { useSafeAddress, useSafeParams } from "@/hooks";
import {
  decodeMultisendTransactions,
  getReserveMultisigBatch,
} from "@/utils/multisend";
import { SafeTx } from "@gearbox-protocol/sdk/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address, Hex } from "viem";
import { usePublicClient } from "wagmi";
import { useInstanceTransactionExecuted } from "./use-instance-transaction-status";

export function useInstanceTransactions({
  cid,
  chainId,
  batches,
  updatableFeeds,
  instanceManager,
  safeAddress,
  createdAtBlock,
  useNonce,
}: {
  cid: string;
  chainId?: number;
  batches?: SafeTx[][];
  updatableFeeds?: Address[][];
  instanceManager?: Address;
  safeAddress?: Address;
  createdAtBlock?: number;
  useNonce?: number;
}): {
  txs: ExtendedSignedTx[];
  safe?: Address;
  isExecuted: boolean | undefined;
  executedTxHash?: Hex;
  isLoading: boolean;
  error: Error | null;
  refetchSigs: () => Promise<unknown>;
} {
  const publicClient = usePublicClient({ chainId });

  const {
    safe,
    isLoading: isLoadingSafe,
    error: errorSafe,
  } = useSafeAddress(chainId, instanceManager, safeAddress);

  const { nonce, signers } = useSafeParams(chainId, safe);

  const {
    isExecuted,
    nonce: executedNonce,
    txHash: executedTxHash,
    isLoading: isLoadingExecuted,
    error: errorExecuted,
  } = useInstanceTransactionExecuted({
    cid,
    chainId,
    batches,
    safeAddress: safe,
    createdAtBlock,
  });

  const {
    data: preparedTxs,
    isLoading: isLoadingPreparedTxs,
    error: errorPreparedTxs,
  } = useQuery({
    queryKey: [
      "prepared-batches",
      cid,
      Number(executedNonce !== undefined ? executedNonce : (useNonce ?? nonce)),
    ],
    queryFn: async () => {
      if (
        !publicClient ||
        !safe ||
        nonce === undefined ||
        isExecuted === undefined
      )
        return;

      // @note currently txs are not batched (batches.len === 1)
      return await Promise.all(
        (batches ?? []).map((batch, index) =>
          getReserveMultisigBatch({
            type: "queue",
            client: publicClient,
            safeAddress: safe,
            batch: batch as SafeTx[],
            nonce:
              Number(
                executedNonce !== undefined
                  ? executedNonce
                  : (useNonce ?? nonce)
              ) + index,
          })
        )
      );
    },
    enabled:
      !!cid &&
      !!publicClient &&
      !!safe &&
      nonce !== undefined &&
      isExecuted !== undefined,
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
        nonce === undefined ||
        isExecuted === undefined
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
      nonce !== undefined &&
      isExecuted !== undefined,
    retry: 3,
  });

  return {
    txs:
      txs?.map((tx, index) => ({
        ...tx,
        updatableFeeds: updatableFeeds?.[index],
      })) ?? [],
    isExecuted,
    executedTxHash,
    safe: safe,
    isLoading:
      isLoadingSafe ||
      isLoadingTxs ||
      isLoadingPreparedTxs ||
      isLoadingExecuted,
    error: errorSafe || errorTxs || errorPreparedTxs || errorExecuted,
    refetchSigs: refetch,
  };
}
