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
import { AccessMode } from "@/core/emergency-actions";
import { getLossPolicyState } from "@/utils/state";
import { shortenHash } from "@gearbox-protocol/permissionless";
import { MarketSuite } from "@gearbox-protocol/sdk";
import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Address, zeroAddress } from "viem";
import { TokenIcon } from "../ui/token-icon";

const ACCESS_MODE_TITLE: Record<AccessMode, string> = {
  [AccessMode.Forbidden]: "Nobody",
  [AccessMode.Permissioned]: "Whitelisted",
  [AccessMode.Permissionless]: "All",
};

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

  const lossPolicyState = useMemo(
    () => getLossPolicyState(market.state.lossPolicy.baseParams),
    [market]
  );

  const liquidationButton = useCallback(
    (accessMode: AccessMode) => {
      if (accessMode === lossPolicyState.state?.accessMode) {
        return (
          <Button
            size="sm"
            variant={"outline"}
            disabled
            className="w-full border-green-500 text-green-500 disabled:opacity-100"
          >
            {ACCESS_MODE_TITLE[accessMode]}
          </Button>
        );
      }

      return (
        <Link
          key={`${chainId}-${marketConfigurator}-setAccessMode`}
          href={{
            pathname: "/emergency/tx",
            query: {
              chainId: chainId,
              mc: marketConfigurator,
              action: "LOSS_POLICY::setAccessMode",
              params: JSON.stringify({
                pool: market.pool.pool.address,
                mode: accessMode,
              }),
            },
          }}
        >
          <Button size="sm" variant={"outline"} className="w-full">
            {ACCESS_MODE_TITLE[accessMode]}
          </Button>
        </Link>
      );
    },
    [chainId, lossPolicyState, market.pool.pool.address, marketConfigurator]
  );

  return (
    <Card className="p-4">
      <Card className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-4">
            <TokenIcon symbol={tokenSymbol} size={36} />
            <CardTitle className="whitespace-nowrap text-base font-medium text-xl">
              Market {market.pool.pool.symbol}
            </CardTitle>
          </div>

          <div className="flex items-start gap-3">
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
              <Button size="sm" variant={"outline"}>
                View
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>Emergency liqudations:</div>

          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3 max-w-[450px]">
            {Object.values(AccessMode)
              .filter((m) => typeof m === "number")
              .map((m) => liquidationButton(m))}
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/3">Contract</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
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
                  <Button size={"xs"} variant={"pink"} disabled>
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
                    <Button size={"xs"} variant={"destructive"}>
                      Pause pool
                    </Button>
                  </Link>
                )}
              </TableCell>
            </TableRow>

            {market.creditManagers.map((cm) => (
              <TableRow key={cm.creditManager.address}>
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
                    <Button size={"xs"} variant={"pink"} disabled>
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
                      <Button size={"xs"} variant={"destructive"}>
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
    </Card>
  );
}
