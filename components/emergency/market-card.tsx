"use client";

import { chains } from "@/config/wagmi";
import {
  Button,
  Card,
  CardTitle,
  CopyButton,
  ExternalButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TokenIcon,
} from "@gearbox-protocol/permissionless-ui";
import { MarketSuite } from "@gearbox-protocol/sdk";
import { shortenHash } from "@gearbox-protocol/sdk/permissionless";
import Link from "next/link";
import { useMemo } from "react";
import { Address, zeroAddress } from "viem";
import { LiquidationSettings } from "./liquidations-settings";

export function MarketCard({
  chainId,
  marketConfigurator,
  market,
  multipause,
  onSelect,
}: {
  chainId: number;
  marketConfigurator: Address;
  market: MarketSuite;
  multipause: Address;
  onSelect: (market: Address) => void;
}) {
  const chain = chains.find(({ id }) => id === chainId);

  const tokenSymbol =
    market.sdk.tokensMeta.symbol(market.pool.underlying) ?? "";

  const marketPaused = useMemo(
    () =>
      market.pool.pool.isPaused &&
      market.creditManagers.every((cm) => cm.creditFacade.isPaused),
    [market]
  );

  return (
    <div className="space-y-4">
      <Link
        key={`${chainId}-${marketConfigurator}-${market.pool.pool.address}`}
        href={{
          pathname: "/emergency",
          query: {
            chainId: chainId,
            mc: marketConfigurator,
            market: market.pool.pool.address,
          },
        }}
      >
        <Card
          variant="interactive"
          className={`flex items-center justify-between space-x-4 p-4 ${marketPaused ? "border-destructive/70 bg-red-900/20 hover:bg-red-900/25" : ""}`}
          onClick={() => onSelect(market.pool.pool.address)}
        >
          <div className="flex items-center space-x-4">
            <TokenIcon symbol={tokenSymbol} size={36} />
            <CardTitle className="whitespace-nowrap text-base font-medium text-xl">
              Market {market.pool.pool.symbol}
            </CardTitle>
          </div>
          {marketPaused && (
            <Button
              size={"lg"}
              variant={"ghost"}
              disabled
              className="text-accent-foreground/80 disabled:opacity-100"
            >
              Market paused
            </Button>
          )}
        </Card>
      </Link>

      <div className="flex items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4 w-full">
          <div>Emergency liqudations:</div>

          <LiquidationSettings
            chainId={chainId}
            marketConfigurator={marketConfigurator}
            market={market}
          />
        </div>

        {!!multipause && multipause !== zeroAddress && !marketPaused ? (
          <Link
            key={`${chainId}-${marketConfigurator}-pauseMarket`}
            href={{
              pathname: "/emergency/tx",
              query: {
                chainId: chainId,
                mc: marketConfigurator,
                action: "MULTI_PAUSE::pauseMarket",
                params: JSON.stringify({
                  pool: market.pool.pool.address,
                }),
              },
            }}
          >
            <Button size="sm" variant={"destructive"}>
              Pause market
            </Button>
          </Link>
        ) : undefined}
      </div>

      <div className="px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/3">Contract</TableHead>
              <TableHead className="text-center">
                <div className="flex justify-end">
                  <p className="w-24">Action</p>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              className={market.pool.pool.isPaused ? "bg-red-900/20" : ""}
            >
              <TableCell>
                <div className="flex gap-1 items-center whitespace-nowrap">
                  <div>Pool</div>
                  <div className="text-muted-foreground text-sm">
                    ({shortenHash(market.pool.pool.address)})
                  </div>

                  <CopyButton text={market.pool.pool.address} />
                  {chain?.blockExplorers.default.url && (
                    <ExternalButton
                      url={`${chain.blockExplorers.default.url}/address/${market.pool.pool.address}`}
                    />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {market.pool.pool.isPaused ? (
                  <Button
                    className="w-24 text-accent-foreground/80 disabled:opacity-100"
                    size={"xs"}
                    variant={"ghost"}
                    disabled
                  >
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
                          pool: market.pool.pool.address,
                        }),
                      },
                    }}
                  >
                    <Button
                      className="w-24"
                      size={"xs"}
                      variant={"destructive"}
                    >
                      Pause pool
                    </Button>
                  </Link>
                )}
              </TableCell>
            </TableRow>

            {market.creditManagers.map((cm) => (
              <TableRow
                key={cm.creditManager.address}
                className={cm.creditFacade.isPaused ? "bg-red-900/20" : ""}
              >
                <TableCell>
                  <div className="flex gap-1 items-center whitespace-nowrap">
                    <div>CM: {cm.name}</div>
                    <div className="text-muted-foreground text-sm">
                      ({shortenHash(cm.creditManager.address)})
                    </div>

                    <CopyButton text={cm.creditManager.address} />
                    {chain?.blockExplorers.default.url && (
                      <ExternalButton
                        url={`${chain.blockExplorers.default.url}/address/${cm.creditManager.address}`}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {cm.creditFacade.isPaused ? (
                    <Button
                      className="w-24 text-accent-foreground/80 disabled:opacity-100"
                      size={"xs"}
                      variant={"ghost"}
                      disabled
                    >
                      CM paused
                    </Button>
                  ) : (
                    <Link
                      key={`${chainId}-${marketConfigurator}-${cm.creditManager.address}-creditPause`}
                      href={{
                        pathname: "/emergency/tx",
                        query: {
                          chainId: chainId,
                          mc: marketConfigurator,
                          action: "CREDIT::pause",
                          params: JSON.stringify({
                            creditManager: cm.creditManager.address,
                          }),
                        },
                      }}
                    >
                      <Button
                        className="w-24"
                        size={"xs"}
                        variant={"destructive"}
                      >
                        Pause CM
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
