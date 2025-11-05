"use client";

import { chains } from "@/config/wagmi";
import {
  useGetMarketConfiguratorInfo,
  useGetMultipause,
  useSDK,
} from "@/hooks";
import {
  Button,
  CopyButton,
  ExternalButton,
  PageLayout,
} from "@gearbox-protocol/permissionless-ui";
import { shortenHash } from "@gearbox-protocol/sdk/permissionless";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Address, isAddress, zeroAddress } from "viem";
import { SkeletonStacks } from "../ui/skeleton";
import { MarketCard } from "./market-card";
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
    data: multipause,
    isLoading: isLoadingMultipause,
    error: multipauseError,
  } = useGetMultipause({
    chainId,
    marketConfigurator: address,
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

  if (isLoadingSdk || isLoadingInfo || isLoadingMultipause) {
    return <SkeletonStacks />;
  }

  if (sdkError || infoError || multipauseError) {
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

            <CopyButton text={address} />
            {chain?.blockExplorers.default.url && (
              <ExternalButton
                url={`${chain.blockExplorers.default.url}/address/${address}`}
              />
            )}
          </div>
        }
        backButton={{
          href: "/emergency",
          text: "Back to market configurators",
          onClick: onClickBack,
        }}
        actionButton={
          !!multipause && multipause !== zeroAddress ? (
            <Link
              key={`${chainId}-${marketConfigurator}-pauseAll`}
              href={{
                pathname: "/emergency/tx",
                query: {
                  chainId: chainId,
                  mc: address,
                  action: "MULTI_PAUSE::pauseAll",
                  params: JSON.stringify({}),
                },
              }}
            >
              <Button variant={"destructive"}>Pause all contracts</Button>
            </Link>
          ) : undefined
        }
      >
        <div className="space-y-2">
          {markets.length === 0 ? (
            <div>There is no markets</div>
          ) : (
            <div className="space-y-12">
              {markets.map((market) => (
                <MarketCard
                  key={`${address}-${market.pool.pool.address}`}
                  chainId={chainId}
                  marketConfigurator={address}
                  market={market}
                  multipause={multipause ?? zeroAddress}
                  onSelect={(market: Address) => {
                    setSelectedMarket(market);
                  }}
                />
              ))}
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
