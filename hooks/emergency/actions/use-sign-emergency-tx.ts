import { safeAbi } from "@/abi";
import { EmergencyTx } from "@/core/emergency-actions/types";
import { useBuildEmergencySafeTx } from "@/hooks";
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { Address, Hex } from "viem";
import { useAccount, useConfig, useSwitchChain, useWalletClient } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export function useSignEmergencyTx({
  chainId,
  safe,
  emergencyTx,
  nonce,
  onSuccess,
}: {
  chainId: number;
  safe: Address;
  emergencyTx: EmergencyTx;
  nonce: number;
  onSuccess: (txHash: Hex) => void;
}) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const config = useConfig();

  const publicClient = useMemo(
    () => getPublicClient(config, { chainId }),
    [config, chainId]
  );

  const { switchChainAsync } = useSwitchChain();

  const { refetchSigs } = useBuildEmergencySafeTx({
    chainId,
    safe,
    emergencyTx,
    nonce,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (args: { txHash: Hex }) => {
      if (!walletClient || !publicClient || !address) return;

      await switchChainAsync({
        chainId,
      });

      try {
        const tx = await walletClient.writeContract({
          address: safe,
          abi: safeAbi,
          functionName: "approveHash",
          args: [args.txHash],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });

        console.log("receipt", receipt);

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        toast.success("Transaction confirmed successfully");

        refetchSigs();
        onSuccess(args.txHash);
      } catch (error) {
        console.error(error);
        toast.error("Transaction confirm failed");
      }
    },
  });

  return {
    sign: mutateAsync,
    isPending,
    error: null,
  };
}
