import { safeAbi } from "@/abi";
import { useCurrentTransactions } from "@/hooks";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Address, Hex } from "viem";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";

export function useSignTx(
  chainId: number,
  cid: string,
  safeAddress: Address,
  onSuccess: (txHash: Hex) => void
) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId });
  const { switchChainAsync } = useSwitchChain();

  const { refetchSigs } = useCurrentTransactions(cid);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (args: { txHash: Hex }) => {
      if (!walletClient || !publicClient || !address || !safeAddress) return;

      await switchChainAsync({ chainId });

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
