"use client";

import { safeAbi } from "@/abi";
import { EmergencyTx } from "@/core/emergency-actions";
import { SignedTx } from "@/core/safe-tx";
import { useSafeParams } from "@/hooks";
import {
  decodeMultisendTransactions,
  getReserveMultisigBatch,
} from "@/utils/multisend";
import { convertRawTxToSafeMultisigTx } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Address, Hex } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export function useBuildEmergencySafeTx({
  chainId,
  safe,
  emergencyTx,
  nonce,
}: {
  chainId: number;
  safe: Address;
  emergencyTx: EmergencyTx;
  nonce?: number;
}): {
  tx?: SignedTx;
  safe: Address;
  isLoading: boolean;
  error: Error | null;
  refetchSigs: () => Promise<unknown>;
} {
  const config = useConfig();

  const publicClient = useMemo(
    () => getPublicClient(config, { chainId }),
    [config, chainId]
  );

  const {
    nonce: currentNonce,
    signers,
    isLoading,
    error,
  } = useSafeParams(safe);

  const usingNonce = useMemo(
    () => (nonce === undefined ? currentNonce : BigInt(nonce)),
    [currentNonce, nonce]
  );

  const {
    data: preparedTx,
    isLoading: isLoadingPreparedTx,
    error: errorPreparedTx,
  } = useQuery({
    queryKey: ["prepare-tx", chainId, safe, emergencyTx.tx.callData],
    queryFn: async () => {
      if (!publicClient || usingNonce === undefined) return;

      return await getReserveMultisigBatch({
        type: "queue",
        client: publicClient,
        safeAddress: safe,
        batch: [convertRawTxToSafeMultisigTx(emergencyTx.tx)],
        nonce: Number(usingNonce),
      });
    },
    enabled: !!publicClient && usingNonce !== undefined,
    retry: 3,
  });

  const {
    data: tx,
    isLoading: isLoadingTx,
    error: errorTx,
    refetch,
  } = useQuery({
    queryKey: ["emergency-safe-tx", chainId, safe, emergencyTx.tx.callData],
    queryFn: async () => {
      if (!publicClient || !signers || !preparedTx || usingNonce === undefined)
        return;

      const signedBy = await Promise.all(
        signers.map((signer) =>
          publicClient.readContract({
            address: safe,
            abi: safeAbi,
            functionName: "approvedHashes",
            args: [signer, preparedTx.hash as Hex],
          })
        )
      );

      return {
        ...preparedTx,
        to: preparedTx.to as Address,
        value: BigInt(preparedTx.value),
        data: preparedTx.data as Hex,
        operation: preparedTx.operation,
        safeTxGas: BigInt(preparedTx.safeTxGas),
        baseGas: BigInt(preparedTx.baseGas),
        gasPrice: BigInt(preparedTx.gasPrice),
        gasToken: preparedTx.gasToken as Address,
        refundReceiver: preparedTx.refundReceiver as Address,
        nonce: BigInt(preparedTx.nonce),
        hash: preparedTx.hash as Hex,
        signedBy: [
          ...(signers.filter((_, index) => signedBy[index] > 0) as Address[]),
        ],
        calls: decodeMultisendTransactions(preparedTx.data as Hex),
      } as SignedTx;
    },
    enabled:
      !!publicClient && !!signers && !!preparedTx && usingNonce !== undefined,
    retry: 3,
  });

  return {
    tx,
    safe,
    isLoading: isLoading || isLoadingTx || isLoadingPreparedTx,
    error: error || errorTx || errorPreparedTx,
    refetchSigs: refetch,
  };
}
