import { EmergencyTx } from "@/core/emergency-actions";
import { getPriceUpdateTx } from "@gearbox-protocol/sdk/permissionless";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";

export function useSendEoaEmergencyTx({
  chainId,
  emergencyTx,
}: {
  chainId: number;
  emergencyTx: EmergencyTx;
}) {
  const { address } = useAccount();

  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId });

  const priceFeeds =
    emergencyTx.action.type === "ORACLE::setPriceFeed"
      ? [emergencyTx.action.params.priceFeed]
      : [];

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!walletClient || !publicClient || !address) return;

      await switchChainAsync({ chainId });

      const updateTx =
        priceFeeds.length === 0
          ? undefined
          : await getPriceUpdateTx({
              client: publicClient,
              priceFeeds,
              useMulticall3: true,
            });

      if (updateTx) {
        await publicClient.call({
          to: updateTx.to,
          data: updateTx.callData,
          value: updateTx.value ? BigInt(updateTx.value) : undefined,
        });

        const gas = await publicClient.estimateGas({
          account: address,
          to: updateTx.to,
          data: updateTx.callData,
          value: updateTx.value ? BigInt(updateTx.value) : undefined,
        });

        console.log("Estimated gas", gas);
        const adjustedGas = gas < 28000000n ? (gas * 11n) / 10n : gas;
        console.log("Adjusted gas", adjustedGas);

        try {
          const txHash = await walletClient.sendTransaction({
            to: updateTx.to,
            data: updateTx.callData,
            value: updateTx.value ? BigInt(updateTx.value) : undefined,
            gas: adjustedGas,
          });

          console.log("txHash", txHash);

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });

          console.log("receipt", receipt);

          if (receipt.status === "reverted") {
            throw new Error("Price feeds update transaction reverted");
          }

          toast.success(`Successfully updated price feeds`);

          return true;
        } catch (error) {
          console.error(error);
          toast.error(`Price feeds update failed`);
        }
      }

      await publicClient.call({
        to: emergencyTx.tx.to,
        data: emergencyTx.tx.callData,
        value: emergencyTx.tx.value ? BigInt(emergencyTx.tx.value) : undefined,
      });

      const gas = await publicClient.estimateGas({
        account: address,
        to: emergencyTx.tx.to,
        data: emergencyTx.tx.callData,
        value: emergencyTx.tx.value ? BigInt(emergencyTx.tx.value) : undefined,
      });

      console.log("Estimated gas", gas);
      const adjustedGas = gas < 28000000n ? (gas * 11n) / 10n : gas;
      console.log("Adjusted gas", adjustedGas);

      try {
        const txHash = await walletClient.sendTransaction({
          to: emergencyTx.tx.to,
          data: emergencyTx.tx.callData,
          value: emergencyTx.tx.value
            ? BigInt(emergencyTx.tx.value)
            : undefined,
          gas: adjustedGas,
        });

        console.log("txHash", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        console.log("receipt", receipt);

        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        toast.success(`Transaction executed successfully`);

        return true;
      } catch (error) {
        console.error(error);
      }
    },
  });

  return {
    send: mutateAsync,
    isPending: isPending,
    error: null,
  };
}
