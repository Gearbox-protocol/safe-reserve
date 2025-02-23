import { useMutation } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";

import { safeAbi } from "@/bindings/generated";
import { Address, Hex } from "viem";

export function useSignTx(
  safeAddress: Address,
  onSuccess: (txHash: Hex) => void
) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (args: { txHash: Hex }) => {
      if (!walletClient || !publicClient || !address || !safeAddress) return;

      await switchChainAsync({
        chainId: 146,
      });

      try {
        const tx = await walletClient.writeContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "approveHash",
          args: [args.txHash],
        });

        await publicClient.waitForTransactionReceipt({ hash: tx });
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
