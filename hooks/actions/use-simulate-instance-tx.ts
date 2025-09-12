import { SignedTx } from "@/core/safe-tx";
import { useDecodeInstanceCalls } from "@/hooks";
import { getPriceFeedFromInstanceParsedCall } from "@/utils/parsed-call-utils";
import { Address } from "viem";
import { useBaseSimulateTx } from "./use-base-simulate-tx";

export function useSimulateInstanceTx(
  safeAddress: Address,
  instanceManager: Address,
  tx: SignedTx
) {
  const parsedCalls = useDecodeInstanceCalls(instanceManager, tx.calls);
  const priceFeeds = parsedCalls
    .map(getPriceFeedFromInstanceParsedCall)
    .filter((priceFeed) => priceFeed !== undefined) as Address[];

  return useBaseSimulateTx({
    safeAddress,
    tx,
    priceFeeds,
    useMulticall3ForPriceUpdate: true,
  });
}
