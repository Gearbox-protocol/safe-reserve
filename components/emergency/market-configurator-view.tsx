"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { chains } from "@/config/wagmi";
import { useGetMarketConfiguratorInfo, useSDK } from "@/hooks";
import { shortenHash } from "@gearbox-protocol/permissionless";
import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Address, isAddress } from "viem";
import { Button } from "../ui/button";
import { PageLayout } from "../ui/page";
import { TokenIcon } from "../ui/token-icon";
import { MarketView } from "./market/market-view";

export function MarketConfiguratorView({
  chainId,
  address,
  onClickBack,
}: {
  chainId: number;
  address: Address;
  onClickBack: () => void;
}) {
  const [selectedMarket, setSelectedMarket] = useState<Address>();

  const {
    data: mcInfo,
    isLoading: isLoadingInfo,
    error: infoError,
  } = useGetMarketConfiguratorInfo({
    chainId,
    address,
  });

  const {
    data: sdk,
    isLoading: isLoadingSdk,
    error: sdkError,
  } = useSDK({
    chainId,
    configurators: [address],
  });

  const chain = chains.find(({ id }) => id === chainId);

  const marketConfigurator = useMemo(
    () =>
      (sdk?.marketRegister.marketConfigurators ?? []).find(
        (mc) => mc.address.toLowerCase() === address.toLowerCase()
      ),
    [address, sdk?.marketRegister.marketConfigurators]
  );

  const markets = useMemo(() => sdk?.marketRegister.markets ?? [], [sdk]);

  const isMarketSelected = useMemo(() => {
    const marketAddresses = markets.map(
      (m) => m.pool.pool.address.toLowerCase() as Address
    );
    return (
      selectedMarket &&
      marketAddresses.includes(selectedMarket.toLowerCase() as Address)
    );
  }, [markets, selectedMarket]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const market = params.get("market");
    if (market && isAddress(market)) {
      setSelectedMarket(market);
    }
  }, []);

  if (isLoadingSdk || isLoadingInfo) {
    return (
      <div className="divide-y divide-gray-800 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="h-6 w-1/3 bg-gray-800 rounded mb-4" />
            <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
            <div className="h-4 w-1/4 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (sdkError || infoError) {
    return (
      <div className="p-4">
        <text className="font-semibold text-white">
          Invalid market cofigurator: {sdkError?.message || infoError?.message}
        </text>
      </div>
    );
  }

  if (!isMarketSelected || !selectedMarket) {
    return (
      <PageLayout
        title={
          marketConfigurator && mcInfo?.curatorName
            ? mcInfo.curatorName
            : "Unknown market cofigurator"
        }
        description={
          <div className="flex items-center gap-2 text-gray-100">
            <div className="text-sm text-muted-foreground break-all">
              {chain?.name ?? chainId} · {shortenHash(address)}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white p-0 h-auto"
              onClick={() => {
                navigator.clipboard.writeText(address);
                toast.success("Address copied to clipboard");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>

            {chain?.blockExplorers.default.url && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-white p-0 h-auto"
                onClick={() =>
                  window.open(
                    `${chain?.blockExplorers.default.url}/address/${address}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        }
        backButton={{
          href: "/emergency",
          text: "Back to market configurators",
          onClick: onClickBack,
        }}
      >
        <div className="space-y-2">
          <div className="text-lg font-bold">Markets</div>
          {markets.length === 0 ? (
            <div>There is no markets</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {markets.map((market) => {
                const addr = market.pool.pool.address;

                return (
                  <Link
                    key={`${chainId}-${address}-${addr}`}
                    href={{
                      pathname: "/emergency",
                      query: {
                        chainId: chainId,
                        mc: address,
                        market: addr,
                      },
                    }}
                  >
                    <Card
                      className="p-4 cursor-pointer hover:bg-gray-900/50"
                      onClick={() => setSelectedMarket(addr)}
                    >
                      <div className="flex items-center space-x-2">
                        <TokenIcon
                          symbol={
                            sdk?.tokensMeta.symbol(market.pool.underlying) ?? ""
                          }
                          size={40}
                        />
                        <div>
                          <CardTitle className="truncate text-base font-medium">
                            {market.pool.pool.symbol}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground break-all">
                            {shortenHash(addr)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  return (
    <MarketView
      chainId={chainId}
      marketConfigurator={address}
      market={selectedMarket}
      onClickBack={() => setSelectedMarket(undefined)}
    />
  );
}
