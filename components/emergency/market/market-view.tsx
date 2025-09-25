"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenIcon } from "@/components/ui/token-icon";
import { chains } from "@/config/wagmi";
import { useGetMarketConfiguratorInfo, useSDK } from "@/hooks";
import { shortenHash } from "@gearbox-protocol/permissionless";
import { CirclePause, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Address, formatUnits } from "viem";
import { AssetsTab } from "./tabs/tab-assets";
import { CreditManagerDetails } from "./tabs/tab-credit-manager-details";
import { LossPolicyTab } from "./tabs/tab-loss-policy";

export function MarketView({
  chainId,
  marketConfigurator,
  market,
  onClickBack,
}: {
  chainId: number;
  marketConfigurator: Address;
  market: Address;
  onClickBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState("assets");

  const chain = chains.find(({ id }) => id === chainId);

  const { data: mcInfo } = useGetMarketConfiguratorInfo({
    chainId,
    address: marketConfigurator,
  });

  const { data: sdk } = useSDK({
    chainId,
    configurators: [marketConfigurator],
  });

  const marketSuite = useMemo(
    () =>
      (sdk?.marketRegister.markets ?? []).find(
        (m) => m.pool.pool.address.toLowerCase() === market.toLowerCase()
      ),
    [sdk, market]
  );

  const sortedCreditManagers = useMemo(() => {
    if (!marketSuite || !sdk) return [];
    const underlyingDecimals = sdk.tokensMeta.decimals(
      marketSuite.pool.pool.underlying
    );

    return marketSuite.creditManagers.sort((a, b) => {
      const limitA =
        marketSuite.pool.pool.creditManagerDebtParams.get(
          a.creditManager.address
        )?.limit ?? 0n;

      const limitB =
        marketSuite.pool.pool.creditManagerDebtParams.get(
          b.creditManager.address
        )?.limit ?? 0n;

      return (
        Number(formatUnits(limitB, underlyingDecimals)) -
        Number(formatUnits(limitA, underlyingDecimals))
      );
    });
  }, [sdk, marketSuite]);

  if (!marketSuite || !mcInfo || !sdk) return <></>;

  return (
    <PageLayout
      title={`${marketSuite.pool.pool.symbol} market`}
      icon={
        <TokenIcon
          symbol={sdk.tokensMeta.symbol(marketSuite.pool.underlying)}
        />
      }
      description={
        <div className="flex items-center gap-2 text-gray-100">
          <div className="text-sm text-muted-foreground break-all">
            {chain?.name ?? chainId} · {mcInfo.curatorName} ·{" "}
            {shortenHash(marketSuite.pool.pool.address)}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-white p-0 h-auto"
            onClick={() => {
              navigator.clipboard.writeText(marketSuite.pool.pool.address);
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
                  `${chain?.blockExplorers.default.url}/address/${marketSuite.pool.pool.address}`,
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
        href: `/emergency?chainId=${chainId}&mc=${marketConfigurator}`,
        text: "Back to market configurator",
        onClick: onClickBack,
      }}
    >
      <div className="space-y-6 overflow-y-auto">
        {marketSuite.pool.pool.isPaused && (
          <Card className="border-destructive p-6">
            <div className="flex items-center gap-2 text-destructive">
              <CirclePause className="h-8 w-8" />
              <CardTitle>Pool is paused</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground/80 ml-10">
              This pool is temporarily paused
            </p>
          </Card>
        )}

        <div className="flex-1 overflow-x-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <TabsList className="flex w-full overflow-x-auto">
              <div className="flex">
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="lossPolicy">Loss Policy</TabsTrigger>

                {sortedCreditManagers.map((cm) => (
                  <TabsTrigger
                    key={cm.creditManager.address}
                    value={`creditManagers-${cm.creditManager.address}`}
                  >
                    CM: {cm.name}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>

            <div className="flex gap-6 flex-1 pt-4">
              <div className="flex-grow overflow-y-auto">
                <TabsContent value="assets" className="mt-0">
                  <AssetsTab
                    sdk={sdk}
                    chainId={chainId}
                    marketConfigurator={marketConfigurator}
                    market={marketSuite}
                  />
                </TabsContent>

                <TabsContent value="lossPolicy" className="mt-0">
                  <LossPolicyTab
                    sdk={sdk}
                    chainId={chainId}
                    marketConfigurator={marketConfigurator}
                    market={marketSuite}
                  />
                </TabsContent>

                {sortedCreditManagers.map((cm) => (
                  <TabsContent
                    key={cm.creditManager.address}
                    value={`creditManagers-${cm.creditManager.address}`}
                    className="mt-0"
                  >
                    <CreditManagerDetails
                      sdk={sdk}
                      chainId={chainId}
                      marketConfigurator={marketConfigurator}
                      market={marketSuite}
                      creditSuite={cm}
                    />
                  </TabsContent>
                ))}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
}
