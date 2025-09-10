"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useGetPriceFeeds } from "@/hooks";
import { PricefeedSelector } from "./selector-pricefeed";
import { MarketAsset, MarketProps } from "./types";

export function AssetsTab(props: MarketProps) {
  const { sdk, chainId, marketConfigurator, market } = props;
  const chain = chains.find(({ id }) => id === chainId);

  const [editingPricefeed, setEditingPricefeed] = useState<{
    asset: Address;
    oldPriceFeed: Address;
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
    const marketAssets: MarketAsset[] = [];

    for (const [address, quota] of market.pool.pqk.quotas.entries()) {
      const normalizedAddress = address.toLowerCase() as Address;

      marketAssets.push({
        address: normalizedAddress,
        symbol: sdk.tokensMeta.symbol(address),
        quotaLimit: Number(formatUnits(quota.limit, underlyingDecimals)),
        mainPriceFeed:
          mainPriceFeeds.get(address as Address)?.address || zeroAddress,
      });
    }

    return marketAssets;
  }, [sdk, market]);

  const {
    data: priceFeeds,
    isLoading,
    error,
  } = useGetPriceFeeds({
    chainId,
  });

  return (
    <Card className="max-h-[calc(100vh-300px)] overflow-auto">
      <CardContent className="pt-6">
        {priceFeeds !== undefined ? (
          <>
            <TableEditable title="Assets">
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right pr-6">Quota Limit</TableHead>
                  <TableHead className="text-right pr-6">
                    Main PriceFeed
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
                    newValue={
                      priceFeeds.priceFeedsInfo[
                        underlyingPriceFeed.toLowerCase() as Address
                      ]?.name ?? shortenHash(underlyingPriceFeed)
                    }
                    onEdit={() =>
                      setEditingPricefeed({
                        asset: underlying,
                        oldPriceFeed: underlyingPriceFeed,
                      })
                    }
                  />
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
                      newValue={
                        priceFeeds.priceFeedsInfo[
                          asset.mainPriceFeed.toLowerCase() as Address
                        ]?.name ?? shortenHash(asset.mainPriceFeed)
                      }
                      onEdit={() =>
                        setEditingPricefeed({
                          asset: asset.address,
                          oldPriceFeed: asset.mainPriceFeed,
                        })
                      }
                    />
                  </TableRow>
                ))}
              </TableBody>
            </TableEditable>

            {editingPricefeed && (
              <PricefeedSelector
                {...props}
                initialPriceFeed={
                  editingPricefeed.oldPriceFeed.toLowerCase() as Address
                }
                approvedPriceFeeds={
                  priceFeeds.tokenMap[
                    editingPricefeed.asset.toLowerCase() as Address
                  ] ?? []
                }
                asset={editingPricefeed.asset}
                title={`Set Main Price Feed for ${
                  assets.find(
                    (asset) =>
                      asset.address.toLowerCase() ===
                      editingPricefeed.asset.toLowerCase()
                  )?.symbol ??
                  sdk.tokensMeta.symbol(editingPricefeed.asset) ??
                  shortenHash(editingPricefeed.asset)
                }`}
                onClose={() => setEditingPricefeed(null)}
              />
            )}
          </>
        ) : (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="font-bold">Assets</CardTitle>
            </CardHeader>
            {isLoading ? (
              <div className="space-y-2 p-4 animate-pulse">
                <div className="h-6 w-full bg-muted rounded" />
                <div className="h-6 w-full bg-muted rounded" />
                <div className="h-6 w-full bg-muted rounded" />
              </div>
            ) : error ? (
              <div className="space-y-2 p-4">
                Something went wrong loading assets: {error.message}
              </div>
            ) : (
              <></>
            )}
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
