"use client";

// import reserveJson217 from "@/reserve-upload_217.json";
import cancelJson211 from "@/deploy-state/reserve-cancel_211.json";
// import reserveJson211_0 from "@/deploy-state/reserve-upload_211.json";
import reserveJson211_1 from "@/deploy-state/reserve-upload_211_fixed.json";
import reserveJson211_permissions from "@/deploy-state/reserve-upload_211_permissions.json";

import { useQueries, useQuery } from "@tanstack/react-query";

import { safeAbi } from "@/bindings/generated";
import { ParsedSafeTx, SafeTx } from "@/core/safe-tx";
import { useSafeParams } from "@/hooks/use-safe-params";
import { decodeTransactions } from "@/utils/multisend";
import {
  Address,
  decodeFunctionData,
  encodeAbiParameters,
  Hex,
  keccak256,
  parseAbi,
} from "viem";
import { usePublicClient } from "wagmi";
import { getTxStatus, TimelockTxStatus } from "../utils/tx-status";
import { useTimelock } from "./use-timelock-address";

export function useCurrentTransactions(safeAddress: Address): {
  txs: ParsedSafeTx[];
  governor?: Address;
  isLoading: boolean;
  error: Error | null;
  refetchSigs: () => Promise<unknown>;
} {
  const publicClient = usePublicClient();
  const { signers, nonce } = useSafeParams(safeAddress);

  const {
    data: txs,
    isLoading: isLoadingTxs,
    error: errorTxs,
    refetch,
  } = useQuery({
    queryKey: ["current-transactions", safeAddress],
    queryFn: async () => {
      if (!safeAddress || !publicClient || !signers || nonce === undefined) {
        throw new Error("Missing required parameters");
      }
      const txs = [
        // ...reserveJson211_0,
        ...reserveJson211_1,
        ...reserveJson211_permissions,
        ...cancelJson211,
        // ...reserveJson217,
      ].filter((t) => t.safe.toLowerCase() === safeAddress.toLowerCase());

      const readyTxs: SafeTx[] = [];

      for (const tx of txs) {
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
      !!safeAddress && !!publicClient && !!signers && nonce !== undefined,
    retry: 3,
  });

  const {
    timelock,
    isLoading: isLoadingTimelock,
    error: errorTimelock,
  } = useTimelock(txs?.[0]?.calls[0].to);

  const statuses = useQueries({
    queries: (txs ?? []).map((tx) => ({
      queryKey: ["tx-status", safeAddress, tx.hash],
      queryFn: async () => {
        if (!publicClient || !safeAddress || !timelock) return;

        if (
          tx.calls.length < 2 ||
          tx.calls[0].functionName !== "startBatch" ||
          tx.calls[1].functionName !== "queueTransaction"
        ) {
          return {
            status: TimelockTxStatus.NotFound,
            blockNumber: -1,
          };
        }

        const eta = Number(tx.calls[0].functionArgs[0]);
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
              tx.calls[1].functionArgs[0] as Address,
              tx.calls[1].functionArgs[1] as bigint,
              tx.calls[1].functionArgs[2] as string,
              tx.calls[1].functionArgs[3] as Hex,
              tx.calls[1].functionArgs[4] as bigint,
            ]
          )
        );

        return await getTxStatus({
          publicClient,
          timelock,
          txHash,
          eta,
        });
      },

      enabled: !!safeAddress && !!publicClient && !!txs && !!timelock,
      retry: 3,
    })),
  });

  return {
    txs:
      !!txs && !!statuses && txs.length === statuses.length
        ? txs.map((tx, index) => ({
            ...tx,
            status: statuses[index].data?.status ?? TimelockTxStatus.NotFound,
            queueBlock: statuses[index].data?.blockNumber ?? -1,
            eta: Number(tx.calls[0].functionArgs[0]),
            fetchStatus: statuses[index].refetch,
          }))
        : [],
    governor: txs?.[0].calls[0].to,
    isLoading:
      isLoadingTxs ||
      isLoadingTimelock ||
      !!statuses.find(({ isLoading }) => !!isLoading),
    error: (errorTxs ||
      errorTimelock ||
      statuses.find(({ error }) => error)) as Error | null,
    refetchSigs: refetch,
  };
}
