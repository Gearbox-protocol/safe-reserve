import { useMutation } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { safeAbi } from "@/bindings/generated";
import { Address, Hex } from "viem";

export function useSignTx(safeAddress: Address) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (args: { txHash: Hex }) => {
      if (!walletClient || !publicClient || !address || !safeAddress) return;

      try {
        const tx = await walletClient.writeContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "approveHash",
          args: [args.txHash],
        });

        console.log("tx", tx);

        await publicClient.waitForTransactionReceipt({ hash: tx });
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
