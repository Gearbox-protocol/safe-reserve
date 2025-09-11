"use client";

import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/ui/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenIcon } from "@/components/ui/token-icon";
import { chains } from "@/config/wagmi";
import { useGetMarketConfiguratorInfo, useSDK } from "@/hooks";
import { shortenHash } from "@gearbox-protocol/permissionless";
import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Address } from "viem";
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
      actionButton={
        marketSuite.pool.pool.isPaused ? (
          <Button variant={"pink"} disabled>
            Pool paused
          </Button>
        ) : (
          <Link
            key={`${chainId}-${marketConfigurator}-poolPause`}
            href={{
              pathname: "/emergency/tx",
              query: {
                chainId: chainId,
                mc: marketConfigurator,
                action: "POOL::pause",
                params: JSON.stringify({
                  pool: marketSuite.pool.pool.address,
                }),
              },
            }}
          >
            <Button variant={"pink"}>Pause pool</Button>
          </Link>
        )
      }
    >
      <div className="space-y-6 overflow-y-auto">
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
                {marketSuite.creditManagers.map((cm) => (
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

                {marketSuite.creditManagers.map((cm) => (
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
