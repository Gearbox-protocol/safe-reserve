import { useMutation } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { safeStorageAbi } from "@/bindings/generated";
import { SAFE_STORAGE_ADDRESS } from "@/utils/constant";
import { Address, Hex } from "viem";

export function useExecuteTx(safeAddress: Address) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (args: { txHash: Hex }) => {
      if (!walletClient || !publicClient || !address || !safeAddress) return;

      try {
        const tx = await walletClient.writeContract({
          address: SAFE_STORAGE_ADDRESS,
          abi: safeStorageAbi,
          functionName: "executeTx",
          args: [safeAddress, args.txHash],
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
