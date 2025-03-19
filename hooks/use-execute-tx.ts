import { safeAbi } from "@/bindings/generated";
import { SafeTx } from "@/core/safe-tx";
import { useSafeParams } from "@/hooks/use-safe-params";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Address, Hex } from "viem";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";

export function useExecuteTx(safeAddress: Address, tx: SafeTx) {
  const { address } = useAccount();
  const { threshold, update } = useSafeParams(safeAddress);
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!walletClient || !publicClient || !address || !safeAddress) return;

      await switchChainAsync({
        chainId: 1,
      });

      if (!tx.signedBy.includes(walletClient.account.address)) {
        tx.signedBy.push(walletClient.account.address);
      }

      const signatures = tx.signedBy
        .slice(0, threshold)
        .sort((a, b) => a.localeCompare(b))
        .map(
          (signer) =>
            "000000000000000000000000" + signer.slice(2) + "0".repeat(64) + "01"
        )
        .join("");

      try {
        // const dataHash = await publicClient.readContract({
        //   address: safeAddress,
        //   abi: safeAbi,
        //   functionName: "getTransactionHash",
        //   args: [
        //     tx.to as Address,
        //     tx.value,
        //     tx.data as Hex,
        //     tx.operation,
        //     tx.safeTxGas,
        //     tx.baseGas,
        //     tx.gasPrice,
        //     tx.gasToken as Address,
        //     tx.refundReceiver as Address,
        //     tx.nonce,
        //   ],
        // });

        // console.log("dataHash!!!", dataHash);
        // console.log("tx.hash!!!", tx.hash);

        const txHash = await walletClient.writeContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "execTransaction",
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
        });

        console.log("txHash", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log("receipt", receipt);

        toast.success("Transaction executed successfully");
        update();
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
