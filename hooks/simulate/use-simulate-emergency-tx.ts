import { EmergencyTx } from "@/core/emergency-actions";
import { SignedTx } from "@/core/safe-tx";
import { useBaseSimulateTx } from "@/hooks/simulate/use-base-simulate-tx";
import { Address } from "viem";

export function useSimulateEmergencyTx(
  chainId: number,
  safeAddress: Address,
  tx: SignedTx,
  emergencyTx: EmergencyTx
) {
  const priceFeeds =
    emergencyTx.action.type === "ORACLE::setPriceFeed"
      ? [emergencyTx.action.params.priceFeed]
      : [];

  return useBaseSimulateTx({
    chainId,
    safeAddress,
    tx,
    priceFeeds,
    useMulticall3ForPriceUpdate: true,
  });
}
