"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { chains } from "@/config/wagmi";
import { shortenHash } from "@gearbox-protocol/permissionless";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Address, formatUnits, zeroAddress } from "viem";

import {
  TableCellAsset,
  TableCellUpdatable,
  TableEditable,
} from "@/components/ui/editable-table";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarketAsset, MarketProps } from "./types";

export function AssetsTab({
  sdk,
  chainId,
  marketConfigurator,
  market,
}: MarketProps) {
  const chain = chains.find(({ id }) => id === chainId);

  const [editingPricefeed, setEditingPricefeed] = useState<{
    asset: Address;
    oldPriceFeed: Address;
    reserve: boolean;
  } | null>(null);

  const underlying = market.pool.underlying;
  const underlyingPriceFeed =
    market.priceOracle.mainPriceFeeds.get(market.pool.underlying)?.address ||
    zeroAddress;

  const assets = useMemo(() => {
    const underlyingDecimals = sdk.tokensMeta.decimals(
      market.pool.pool.underlying
    );
    const mainPriceFeeds = market.priceOracle.mainPriceFeeds;
    const reservePriceFeeds = market.priceOracle.reservePriceFeeds;
    const marketAssets: MarketAsset[] = [];

    for (const [address, quota] of market.pool.pqk.quotas.entries()) {
      const normalizedAddress = address.toLowerCase() as Address;

      marketAssets.push({
        address: normalizedAddress,
        symbol: sdk.tokensMeta.symbol(address),
        quotaLimit: Number(formatUnits(quota.limit, underlyingDecimals)),
        mainPriceFeed:
          mainPriceFeeds.get(address as Address)?.address || zeroAddress,
        reservePriceFeed:
          reservePriceFeeds.get(address as Address)?.address || zeroAddress,
      });
    }

    return marketAssets;
  }, [sdk, market]);

  return (
    <Card className="max-h-[calc(100vh-300px)] overflow-auto">
      <CardContent className="pt-6">
        <TableEditable title="Assets">
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right pr-6">Quota Limit</TableHead>
              <TableHead className="text-right pr-6">Main PriceFeed</TableHead>
              <TableHead className="text-right pr-6">
                Reserve PriceFeed
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow key={underlying}>
              <TableCellAsset
                assetAddress={underlying}
                symbol={sdk.tokensMeta.symbol(underlying)}
                comment={"underlying"}
                explorerUrl={chain?.blockExplorers.default.url}
              />

              <TableCell>
                <div className={"flex justify-end w-full text-right pr-6"}>
                  ---
                </div>
              </TableCell>

              <TableCellUpdatable
                // TODO:
                disabled
                newValue={
                  sdk.contracts.get(underlyingPriceFeed)?.name ??
                  shortenHash(underlyingPriceFeed)
                }
                onEdit={() =>
                  setEditingPricefeed({
                    asset: underlying,
                    oldPriceFeed: underlyingPriceFeed,
                    reserve: false,
                  })
                }
              />

              <TableCell>
                <div className={"flex justify-end w-full text-right pr-6"}>
                  ---
                </div>
              </TableCell>
            </TableRow>

            {assets.map((asset) => (
              <TableRow key={asset.address}>
                <TableCellAsset
                  assetAddress={asset.address}
                  symbol={asset.symbol}
                  explorerUrl={chain?.blockExplorers.default.url}
                />

                <TableCellUpdatable
                  newValue={asset.quotaLimit.toString()}
                  postfix={sdk.tokensMeta.symbol(underlying)}
                  nowrap
                  customButton={
                    <Link
                      key={`${chainId}-${marketConfigurator}-setTokenLimitToZero`}
                      href={{
                        pathname: "/emergency/tx",
                        query: {
                          chainId: chainId,
                          mc: marketConfigurator,
                          action: "POOL::setTokenLimitToZero",
                          params: JSON.stringify({
                            pool: market.pool.pool.address,
                            token: asset.address,
                          }),
                        },
                      }}
                    >
                      <Button variant={"pink"} size={"xs"}>
                        Set to 0
                      </Button>
                    </Link>
                  }
                />
                <TableCellUpdatable
                  // TODO:
                  disabled
                  newValue={
                    sdk.contracts.get(asset.mainPriceFeed)?.name ??
                    shortenHash(asset.mainPriceFeed)
                  }
                  onEdit={() =>
                    setEditingPricefeed({
                      asset: asset.address,
                      oldPriceFeed: asset.mainPriceFeed,
                      reserve: false,
                    })
                  }
                />
                <TableCellUpdatable
                  // TODO:
                  disabled
                  newValue={
                    sdk.contracts.get(asset.reservePriceFeed)?.name ??
                    shortenHash(asset.reservePriceFeed)
                  }
                  onEdit={() =>
                    setEditingPricefeed({
                      asset: asset.address,
                      oldPriceFeed: asset.reservePriceFeed,
                      reserve: false,
                    })
                  }
                />
              </TableRow>
            ))}
          </TableBody>
        </TableEditable>

        {editingPricefeed && (
          <></>
          // TODO:
          // <PricefeedSelector
          //   initialPriceFeed={editingPricefeed.oldPriceFeed
          //   }
          //   asset={editingMainPricefeed.asset}
          //   title={`Set Main Price Feed for ${tokenSymbol(
          //     instance,
          //     editingMainPricefeed.address
          //   )}`}
          //   onClose={() => setEditingMainPricefeed(null)}
          //   onSelect={async (pricefeed) => {
          //     await handlePricefeedChange(
          //       "main",
          //       pricefeed.address,
          //       editingMainPricefeed.asset
          //     );
          //   }}
          // />
        )}
      </CardContent>
    </Card>
  );
}
