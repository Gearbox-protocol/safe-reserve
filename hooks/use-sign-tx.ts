import { useMutation } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";

import { safeAbi } from "@/bindings/generated";
import { toast } from "sonner";
import { Address, Hex } from "viem";
import { defaultChainId } from "../config/wagmi";
import { useCurrentTransactions } from "./use-current-transactions";

export function useSignTx(
  safeAddress: Address,
  onSuccess: (txHash: Hex) => void
) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();

  const { refetchSigs } = useCurrentTransactions(safeAddress);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (args: { txHash: Hex }) => {
      if (!walletClient || !publicClient || !address || !safeAddress) return;

      await switchChainAsync({
        chainId: defaultChainId,
      });

      try {
        const tx = await walletClient.writeContract({
          address: safeAddress,
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

        toast.success("Transaction executed successfully");

        refetchSigs();
        onSuccess(args.txHash);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  });

  return {
    sign: mutateAsync,
    isPending,
    error: null,
  };
}
