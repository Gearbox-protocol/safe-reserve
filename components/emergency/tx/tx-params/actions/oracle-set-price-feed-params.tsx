import { Button } from "@/components/ui/button";
import { SetPriceFeedAction } from "@/core/emergency-actions";
import { useGetPriceFeedsInfo } from "@/hooks";
import { GearboxSDK } from "@gearbox-protocol/sdk";
import { Copy, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
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

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white p-0 h-auto"
              onClick={() => {
                navigator.clipboard.writeText(action.params.priceFeed);
                toast.success("Address copied to clipboard");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>

            {sdk.provider.chain?.blockExplorers?.default.url && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-white p-0 h-auto"
                onClick={() =>
                  window.open(
                    `${sdk.provider.chain.blockExplorers?.default.url}/address/${action.params.priceFeed}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            {queries[1].isLoading ? (
              <div className="h-5 w-1/4 bg-muted rounded animate-pulse" />
            ) : (
              <div className="break-all font-mono">{`[${queries[1].data?.type ?? "unknown"}]`}</div>
            )}
            {queries[0].isLoading || queries[1].isLoading ? (
              <div className="h-5 w-1/3 bg-muted rounded animate-pulse" />
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
