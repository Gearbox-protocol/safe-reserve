import { safeAbi } from "@/bindings/generated";
import { defaultChainId } from "@/config/wagmi";
import { ParsedSignedTx } from "@/core/safe-tx";
import { useDecodeGovernorCalls, useSafeParams } from "@/hooks";
import { TimelockTxStatus } from "@/utils/tx-status";
import {
  getCallsTouchedPriceFeeds,
  getPriceUpdateTx,
} from "@gearbox-protocol/permissionless";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Address, Hex } from "viem";
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
  const { threshold, refetch } = useSafeParams(safeAddress);
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  const parsedCalls = useDecodeGovernorCalls(governor, tx.calls);
  const priceFeeds = getCallsTouchedPriceFeeds(parsedCalls);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!walletClient || !publicClient || !address || !safeAddress) return;

      await switchChainAsync({
        chainId: defaultChainId,
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

      const isQueueTx = tx.status === TimelockTxStatus.NotFound;
      const updateTx =
        isQueueTx || priceFeeds.length === 0
          ? undefined
          : await getPriceUpdateTx({
              client: publicClient,
              priceFeeds,
            });

      if (updateTx) {
        try {
          const txHash = await walletClient.sendTransaction({
            account: walletClient.account,
            to: updateTx.to,
            value: 0n,
            data: updateTx.callData,
          });

          console.log("txHash", txHash);

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });

          console.log("receipt", receipt);

          if (receipt.status === "reverted") {
            throw new Error("Transaction reverted");
          }

          toast.success("Successfully updated price feeds");
        } catch (error) {
          console.error(error);
          toast.error("Price feeds update failed");
        }
      }

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

        await publicClient.simulateContract({
          account: walletClient.account,
          ...exectxParams,
        });

        try {
          const txHash = await walletClient.writeContract(exectxParams);

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
    isPending,
    error: null,
  };
}
