import { SetPriceFeedAction } from "@/core/emergency-actions";
import { useGetPriceFeedsInfo } from "@/hooks";
import {
  CopyButton,
  ExternalButton,
  Skeleton,
} from "@gearbox-protocol/permissionless-ui";
import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useMemo } from "react";
import { formatUnits, zeroAddress } from "viem";
import { AddressParamsView } from "./address-param";

const convertToUsd = (value?: bigint) =>
  value !== undefined
    ? `$${Number(formatUnits(value, 8)).toFixed(2)}`
    : undefined;

export function SetPriceFeedParamsView({
  sdk,
  action,
}: {
  sdk: GearboxSDK;
  action: SetPriceFeedAction;
}) {
  const [marketSuite, oldPriceFeed] = useMemo(() => {
    const market = sdk.marketRegister.findByPool(action.params.pool);
    const oldPriceFeed =
      market.priceOracle.mainPriceFeeds.get(action.params.token)?.address ||
      zeroAddress;

    return [market, oldPriceFeed];
  }, [sdk, action]);

  const queries = useGetPriceFeedsInfo({
    sdk,
    priceFeeds: [oldPriceFeed, action.params.priceFeed],
  });

  return (
    <div className="space-y-2">
      <AddressParamsView
        sdk={sdk}
        address={action.params.pool}
        title="pool"
        description={`${marketSuite.pool.pool.symbol} market`}
      />
      <AddressParamsView
        sdk={sdk}
        address={action.params.token}
        title="token"
        description={sdk.tokensMeta.symbol(action.params.token)}
      />

      <div className="grid grid-cols-[140px_auto] gap-2">
        <div className="text-gray-400 font-semibold font-mono">priceFeed:</div>

        <div>
          <div className="flex gap-2 text-gray-100 font-mono">
            <div className="break-all">{action.params.priceFeed}</div>
            <CopyButton text={action.params.priceFeed} size="3.5" />
            {sdk.chain?.blockExplorers?.default.url && (
              <ExternalButton
                url={`${sdk.chain.blockExplorers.default.url}/address/${action.params.priceFeed}`}
                size="3.5"
              />
            )}

            {queries[1].isLoading ? (
              <Skeleton className="h-5 w-1/4" />
            ) : (
              <div className="break-all font-mono">{`[${queries[1].data?.type ?? "unknown"}]`}</div>
            )}
            {queries[0].isLoading || queries[1].isLoading ? (
              <Skeleton className="h-5 w-1/3" />
            ) : !queries[0].data || !queries[1].data ? (
              <></>
            ) : (
              <div className="flex gap-2 text-gray-400">
                <div>{`[price change:`}</div>
                <div>{convertToUsd(queries[0].data?.price[0][1])}</div>
                <div>{" → "}</div>
                <div>{`${convertToUsd(queries[1].data?.price[0][1])}]`}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
