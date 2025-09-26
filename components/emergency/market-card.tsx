"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chains } from "@/config/wagmi";
import { shortenHash } from "@gearbox-protocol/permissionless";
import { MarketSuite } from "@gearbox-protocol/sdk";
import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Address, zeroAddress } from "viem";
import { TokenIcon } from "../ui/token-icon";
import { LiquidationSettings } from "./liquidations-settings";

export function MarketCard({
  chainId,
  marketConfigurator,
  market,
  multipause,
}: {
  chainId: number;
  marketConfigurator: Address;
  market: MarketSuite;
  multipause: Address;
}) {
  const chain = chains.find(({ id }) => id === chainId);

  const tokenSymbol =
    market.sdk.tokensMeta.symbol(market.pool.underlying) ?? "";

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
        <Card className="flex items-center space-x-4 p-4 cursor-pointer hover:bg-muted/50">
          <TokenIcon symbol={tokenSymbol} size={36} />
          <CardTitle className="whitespace-nowrap text-base font-medium text-xl">
            Market {market.pool.pool.symbol}
          </CardTitle>
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

        {!!multipause && multipause !== zeroAddress ? (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-white p-0 h-auto"
                    onClick={() => {
                      navigator.clipboard.writeText(market.pool.pool.address);
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
                          `${chain?.blockExplorers.default.url}/address/${market.pool.pool.address}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {market.pool.pool.isPaused ? (
                  <Button
                    className="w-24"
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-white p-0 h-auto"
                      onClick={() => {
                        navigator.clipboard.writeText(cm.creditManager.address);
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
                            `${chain?.blockExplorers.default.url}/address/${cm.creditManager.address}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {cm.creditFacade.isPaused ? (
                    <Button
                      className="w-24"
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
