import { ParsedSignedTx } from "@/core/safe-tx";
import { useDecodeGovernorCalls } from "@/hooks";
import { TimelockTxStatus } from "@/utils/tx-status";
import { getCallsTouchedPriceFeeds } from "@gearbox-protocol/permissionless";
import { Address } from "viem";
import { useBaseSimulateTx } from "./use-base-simulate-tx";

export function useSimulateGovernorTx(
  chainId: number,
  safeAddress: Address,
  governor: Address,
  tx: ParsedSignedTx
) {
  const parsedCalls = useDecodeGovernorCalls(chainId, governor, tx.calls);
  const isQueueTx = tx.status === TimelockTxStatus.NotFound;
  const priceFeeds = getCallsTouchedPriceFeeds(parsedCalls);

  // For queue transactions, we don't need price feeds
  const effectivePriceFeeds = isQueueTx ? [] : priceFeeds;

  return useBaseSimulateTx({
    chainId,
    safeAddress,
    tx,
    priceFeeds: effectivePriceFeeds,
    useMulticall3ForPriceUpdate: true,
  });
}
