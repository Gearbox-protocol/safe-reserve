import { governorAbi } from "@/bindings/generated";
import { ParsedSafeTx } from "@/core/safe-tx";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Address, Hex } from "viem";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { defaultChainId } from "../config/wagmi";

export function useTimelockExecuteTx(safeAddress: Address, tx: ParsedSafeTx) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!walletClient || !publicClient || !address || !safeAddress) return;

      await switchChainAsync({
        chainId: defaultChainId,
      });

      const executionBatch = tx.calls
        .filter((tx) => tx.functionName === "queueTransaction")
        .map((tx) => ({
          target: tx.functionArgs[0] as Address,
          value: tx.functionArgs[1] as bigint,
          signature: tx.functionArgs[2] as string,
          data: tx.functionArgs[3] as Hex,
          eta: tx.functionArgs[4] as bigint,
        }));

      try {
        const txHash = await walletClient.writeContract({
          address: tx.calls[0].to,
          abi: governorAbi,
          functionName: "executeBatch",
          args: [executionBatch],
        });

        console.log("txHash", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log("receipt", receipt);

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        toast.success("Transaction executed successfully");

        tx.fetchStatus();

        return true;
      } catch (error) {
        console.error(error);
        toast.error("Transaction execution failed" + error);
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
