import { SignedTx } from "@/core/safe-tx";
import { useDecodeInstanceCalls } from "@/hooks";
import { getPriceFeedFromInstanceParsedCall } from "@/utils/parsed-call-utils";
import { Address } from "viem";
import { useBaseSimulateTx } from "./use-base-simulate-tx";

export function useSimulateInstanceTx(
  chainId: number,
  safeAddress: Address,
  instanceManager: Address,
  tx: SignedTx
) {
  const parsedCalls = useDecodeInstanceCalls(
    chainId,
    instanceManager,
    tx.calls
  );
  const priceFeeds = parsedCalls
    .map(getPriceFeedFromInstanceParsedCall)
    .filter((priceFeed) => priceFeed !== undefined) as Address[];

  return useBaseSimulateTx({
    chainId,
    safeAddress,
    tx,
    priceFeeds,
    useMulticall3ForPriceUpdate: true,
  });
}
