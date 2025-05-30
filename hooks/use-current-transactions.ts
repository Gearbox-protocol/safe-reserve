"use client";

import testJson from "@/test-txs.json";

import { useQueries, useQuery } from "@tanstack/react-query";

import { ParsedSignedTx, SignedTx } from "@/core/safe-tx";
import { SafeTx } from "@gearbox-protocol/permissionless";
import {
  Address,
  decodeFunctionData,
  encodeAbiParameters,
  Hex,
  keccak256,
  parseAbi,
} from "viem";
import { usePublicClient } from "wagmi";
import { safeAbi } from "../bindings/generated";
import {
  decodeTransactions,
  getReserveMultisigBatch,
} from "../utils/multisend";
import { getTxStatus, TimelockTxStatus } from "../utils/tx-status";
import { useGovernanceAddresses } from "./use-addresses";
import { useSafeParams } from "./use-safe-params";

export function useCurrentTransactions(cid: string): {
  txs: ParsedSignedTx[];
  safe?: Address;
  governor?: Address;
  isLoading: boolean;
  error: Error | null;
  refetchSigs: () => Promise<unknown>;
} {
  const publicClient = usePublicClient();

  const {
    data: ipfsData,
    isLoading: isLoadingIpfsData,
    error: errorIpfsData,
  } = useQuery({
    queryKey: ["ipfs-transactions", cid],
    queryFn: async () => {
      if (!cid || !publicClient) {
        throw new Error("Missing required parameters");
      }

      // TODO: fetch txs from ipfs
      const txs = testJson;

      return txs;
    },
    enabled: !!cid && !!publicClient,
    retry: 3,
  });

  const {
    safeAddress,
    timelockAddress,
    governorAddress,
    isLoading: isLoadingAddresses,
    error: errorAddresses,
  } = useGovernanceAddresses(
    ipfsData?.marketConfigurator as Address | undefined
  );

  const statuses = useQueries({
    queries: (ipfsData?.queueBatches ?? []).map((batch, index) => ({
      queryKey: ["batch-status", cid, index],
      queryFn: async () => {
        if (!publicClient || !safeAddress || !timelockAddress) return;

        if (
          batch.length < 2 ||
          batch[0].contractMethod.name !== "startBatch" ||
          batch[1].contractMethod.name !== "queueTransaction"
        ) {
          return {
            status: TimelockTxStatus.NotFound,
            blockNumber: -1,
          };
        }

        const eta = Number(batch[0].contractInputsValues.eta);
        if (ipfsData && ipfsData.eta !== eta) {
          throw new Error("Invalid ETA");
        }

        const txHash = keccak256(
          encodeAbiParameters(
            [
              { type: "address", name: "target" },
              { type: "uint", name: "value" },
              { type: "string", name: "signature" },
              { type: "bytes", name: "data" },
              { type: "uint", name: "eta" },
            ],
            [
              batch[1].contractInputsValues.target as Address,
              BigInt(Number(batch[1].contractInputsValues.value)),
              batch[1].contractInputsValues.signature as string,
              batch[1].contractInputsValues.data as Hex,
              BigInt(Number(batch[1].contractInputsValues.eta)),
            ]
          )
        );

        return await getTxStatus({
          publicClient,
          timelock: timelockAddress,
          txHash,
          eta,
        });
      },

      enabled:
        !!ipfsData && !!safeAddress && !!publicClient && !!timelockAddress,
      retry: 3,
    })),
  });

  const { nonce, signers } = useSafeParams(safeAddress);

  const {
    data: preparedTxs,
    isLoading: isLoadingPreparedTxs,
    error: errorPreparedTxs,
  } = useQuery({
    queryKey: ["prepared-batches", cid],
    queryFn: async () => {
      if (
        !publicClient ||
        !safeAddress ||
        nonce === undefined ||
        !statuses.every((s) => s.data !== undefined)
      )
        return;

      const allBatchesQueued = statuses.every(
        ({ data }) => data?.status !== TimelockTxStatus.NotFound
      );

      const startIndex = statuses.findIndex(
        ({ data }) =>
          data?.status ===
          (allBatchesQueued
            ? TimelockTxStatus.NotFound
            : TimelockTxStatus.Ready)
      );

      // TODO: check status and pass execute tx if needed
      return await Promise.all(
        (ipfsData?.queueBatches ?? []).map((batch, index) =>
          getReserveMultisigBatch({
            type: allBatchesQueued ? "execute" : "queue",
            client: publicClient,
            safeAddress,
            batch: batch as SafeTx[],
            nonce:
              startIndex === -1
                ? Number(nonce) + index
                : Number(nonce) + index - startIndex,
          })
        )
      );
    },
    enabled:
      !!cid &&
      !!publicClient &&
      !!safeAddress &&
      nonce !== undefined &&
      statuses.every((s) => s.data !== undefined),
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
        !safeAddress ||
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
              address: safeAddress,
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
          calls: decodeTransactions(tx.data as Hex),
        });
      }

      const functionSignatures = new Set<string>();

      for (const tx of readyTxs) {
        for (const call of tx.calls) {
          const functionSignature = call.data.slice(0, 10);
          if (functionSignature.toLowerCase() === "0x3a66f901") {
            const data = decodeFunctionData({
              abi: parseAbi([
                "function queueTransaction(address,uint256,string,bytes,uint256)",
              ]),
              data: call.data,
            });
            const internalTx = data.args[3] as Hex;

            functionSignatures.add(internalTx.slice(0, 10));
          }
          functionSignatures.add(functionSignature);
        }
      }

      return readyTxs;
    },
    enabled:
      !!cid &&
      !!publicClient &&
      !!signers &&
      !!safeAddress &&
      !!preparedTxs &&
      nonce !== undefined,
    retry: 3,
  });

  return {
    txs:
      !!txs &&
      !!statuses &&
      txs.length === statuses.length &&
      statuses.every((s) => s.data !== undefined)
        ? txs.map((tx, index) => ({
            ...tx,
            status: statuses[index].data?.status ?? TimelockTxStatus.NotFound,
            queueBlock: statuses[index].data?.blockNumber ?? -1,
            eta: Number(tx.calls[0].functionArgs[0]),
            fetchStatus: statuses[index].refetch,
          }))
        : [],
    safe: safeAddress,
    governor: governorAddress,
    isLoading:
      isLoadingTxs ||
      isLoadingIpfsData ||
      isLoadingAddresses ||
      isLoadingPreparedTxs ||
      !!statuses.find(({ isLoading }) => !!isLoading),
    error: (errorTxs ||
      errorIpfsData ||
      errorAddresses ||
      errorPreparedTxs ||
      statuses.find(({ error }) => error)) as Error | null,
    refetchSigs: refetch,
  };
}
