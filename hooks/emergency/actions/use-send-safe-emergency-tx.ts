import { safeAbi } from "@/abi";
import { EmergencyTx } from "@/core/emergency-actions";
import { SignedTx } from "@/core/safe-tx";
import { useSafeParams } from "@/hooks";
import { useSafeSignature } from "@/hooks/actions/use-safe-signature";
import { getMulticall3Params } from "@/utils/multicall3";
import { getPriceUpdateTx } from "@gearbox-protocol/permissionless";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { Address, encodeFunctionData, Hex } from "viem";
import { useAccount, useConfig, useSwitchChain, useWalletClient } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export function useSendSafeEmergencyTx({
  chainId,
  safe,
  tx,
  emergencyTx,
}: {
  chainId: number;
  safe: Address;
  tx: SignedTx;
  emergencyTx: EmergencyTx;
}) {
  const { address } = useAccount();
  const {
    threshold,
    refetch,
    isLoading: isLoadingThreshold,
  } = useSafeParams(safe);

  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();

  const publicClient = useMemo(
    () => getPublicClient(config, { chainId }),
    [config, chainId]
  );

  // Use the Safe signature hook
  const {
    processedSignature: cachedSignature,
    isAlreadySigned,
    signTransaction,
    isSigningPending,
  } = useSafeSignature(tx.hash);

  const priceFeeds =
    emergencyTx.action.type === "ORACLE::setPriceFeed"
      ? [emergencyTx.action.params.priceFeed]
      : [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!walletClient || !publicClient || !address || threshold === undefined)
        return;

      await switchChainAsync({
        chainId,
      });

      let processedSignature: string | null = null;

      // Check if current user needs to sign and handle signature caching
      if (
        !tx.signedBy.includes(walletClient.account.address) &&
        tx.signedBy.length < threshold
      ) {
        try {
          // Use cached signature if available, otherwise sign new
          if (isAlreadySigned && cachedSignature) {
            processedSignature = cachedSignature;
            console.log("Using cached signature", processedSignature);
          } else {
            const signatureData = await signTransaction();
            processedSignature = signatureData.processedSignature;
            console.log("Created new signature", processedSignature);
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to sign message");
          return;
        }
      }

      const signatures =
        tx.signedBy
          .slice(0, processedSignature != null ? threshold - 1 : threshold)
          .sort((a, b) => a.localeCompare(b))
          .map(
            (signer) =>
              "000000000000000000000000" +
              signer.slice(2) +
              "0".repeat(64) +
              "01"
          )
          .join("") + (processedSignature?.slice(2) || "");

      console.log("signatures", signatures.length);
      console.log("processedSignature", processedSignature?.length);

      const updateTx =
        priceFeeds.length === 0
          ? undefined
          : await getPriceUpdateTx({
              client: publicClient,
              priceFeeds,
              useMulticall3: true,
            });

      try {
        const exectxParams = {
          address: safe,
          abi: safeAbi,
          functionName: "execTransaction",
          // gas: 20_000_000n,
          args: [
            tx.to as Address,
            BigInt(tx.value),
            tx.data as Hex,
            tx.operation,
            BigInt(tx.safeTxGas),
            BigInt(tx.baseGas),
            BigInt(tx.gasPrice),
            tx.gasToken as Address,
            tx.refundReceiver as Address,
            `0x${signatures}`,
          ],
        } as const;

        const safeExecCallData = encodeFunctionData({
          abi: safeAbi,
          functionName: "execTransaction",
          args: exectxParams.args,
        });

        const safeExecCall = {
          to: safe,
          callData: safeExecCallData,
        } as const;

        const multicall3 = publicClient.chain.contracts?.multicall3;
        if (!multicall3) {
          toast.error("Multicall3 address not found for chain");
          return;
        }
        const multicall3Calls = updateTx
          ? [updateTx, safeExecCall]
          : [safeExecCall];
        const multicall3Params = getMulticall3Params(
          multicall3.address,
          multicall3Calls
        );

        await publicClient.simulateContract({
          ...multicall3Params,
        });

        const gas = await publicClient.estimateContractGas({
          ...multicall3Params,
        });

        console.log("Estimated gas", gas);
        const adjustedGas = gas < 28000000n ? (gas * 11n) / 10n : gas;
        console.log("Adjusted gas", adjustedGas);

        try {
          const txHash = await walletClient.writeContract({
            ...multicall3Params,
            gas: adjustedGas,
          });

          console.log("txHash", txHash);

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });

          console.log("receipt", receipt);

          if (receipt.status === "reverted") {
            throw new Error("Transaction reverted");
          }

          toast.success(`Transaction executed successfully`);

          refetch();

          return true;
        } catch (error) {
          console.error(error);
          toast.error(`Transaction execution failed`);
        }
      } catch (error) {
        console.error(error);
        toast.error("Transaction simulation failed");
      }
    },
  });

  return {
    send: mutateAsync,
    isPending: isPending || isLoadingThreshold || isSigningPending,
    error: null,
  };
}
