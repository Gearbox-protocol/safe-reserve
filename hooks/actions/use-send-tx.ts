import { safeAbi } from "@/bindings/generated";
import { defaultChainId } from "@/config/wagmi";
import { ParsedSignedTx } from "@/core/safe-tx";
import { useDecodeGovernorCalls, useSafeParams } from "@/hooks";
import { useSafeSignature } from "@/hooks/actions/use-safe-signature";
import { getMulticall3Params } from "@/utils/multicall3";
import { TimelockTxStatus } from "@/utils/tx-status";
import {
  getCallsTouchedPriceFeeds,
  getPriceUpdateTx,
} from "@gearbox-protocol/permissionless";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Address, encodeFunctionData, Hex } from "viem";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";


export function useSendTx(
  safeAddress: Address,
  governor: Address,
  tx: ParsedSignedTx
) {
  const { address } = useAccount();
  const { threshold, refetch, isLoading: isLoadingThreshold } = useSafeParams(safeAddress);
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  
  // Use the Safe signature hook
  const {
    processedSignature: cachedSignature,
    isAlreadySigned,
    signTransaction,
    isSigningPending,
  } = useSafeSignature(tx.hash);

  const parsedCalls = useDecodeGovernorCalls(governor, tx.calls);
  const priceFeeds = getCallsTouchedPriceFeeds(parsedCalls);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!walletClient || !publicClient || !address || !safeAddress || threshold === undefined) return;

      await switchChainAsync({
        chainId: defaultChainId,
      });

      let processedSignature: string | null = null;
      
      // Check if current user needs to sign and handle signature caching
      if (!tx.signedBy.includes(walletClient.account.address)) {
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

      const signatures = tx.signedBy
        .slice(0, processedSignature != null ? threshold - 1 : threshold)
        .sort((a, b) => a.localeCompare(b))
        .map(
          (signer) =>
            "000000000000000000000000" + signer.slice(2) + "0".repeat(64) + "01"
        )
        .join("")
        + (processedSignature?.slice(2) || "");

      console.log("signatures", signatures.length);
      console.log("processedSignature", processedSignature?.length);

      const isQueueTx = tx.status === TimelockTxStatus.NotFound;
      const updateTx =
        isQueueTx || priceFeeds.length === 0
          ? undefined
          : await getPriceUpdateTx({
              client: publicClient,
              priceFeeds,
            });

      try {
        const exectxParams = {
          address: safeAddress,
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
          to: safeAddress,
          callData: safeExecCallData,
        } as const;

        const multicall3 = publicClient.chain.contracts?.multicall3;
        if (!multicall3) {
          toast.error("Multicall3 address not found for chain");
          return;
        }
        const multicall3Calls = updateTx ? [updateTx, safeExecCall] : [safeExecCall];
        const multicall3Params = getMulticall3Params(multicall3.address, multicall3Calls);

        await publicClient.simulateContract({
          ...multicall3Params
        })

        try {
          const txHash = await walletClient.writeContract(multicall3Params);

          console.log("txHash", txHash);

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });

          console.log("receipt", receipt);

          if (receipt.status === "reverted") {
            throw new Error("Transaction reverted");
          }

          toast.success(
            `Transaction ${isQueueTx ? "queued" : "executed"} successfully`
          );

          refetch();
          tx.fetchStatus();

          return true;
        } catch (error) {
          console.error(error);
          toast.error(
            `Transaction ${isQueueTx ? "queue" : "execution"} failed`
          );
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
    // isAlreadySigned,
    // signTransaction,
  };
}
