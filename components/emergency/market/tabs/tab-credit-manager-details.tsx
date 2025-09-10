import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { chains } from "@/config/wagmi";
import { useGetCollateralStatuses } from "@/hooks";
import { shortenHash } from "@gearbox-protocol/permissionless";
import { CreditSuite } from "@gearbox-protocol/sdk";
import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { MarketProps } from "./types";

interface CreditManagerDetailsProps extends MarketProps {
  creditSuite: CreditSuite;
}

export function CreditManagerDetails({
  sdk,
  chainId,
  marketConfigurator,
  market,
  creditSuite,
}: CreditManagerDetailsProps) {
  const chain = chains.find(({ id }) => id === chainId);

  const {
    data: collateralTokens,
    isLoading,
    error,
  } = useGetCollateralStatuses({
    chainId,
    creditSuite,
  });

  const debtLimit = useMemo(() => {
    const underlyingDecimals = sdk.tokensMeta.decimals(
      market.pool.pool.underlying
    );
    const limit = market.pool.pool.creditManagerDebtParams.get(
      creditSuite.creditManager.address
    )?.limit;

    return limit ? Number(formatUnits(limit, underlyingDecimals)) : undefined;
  }, [sdk, market, creditSuite]);

  return (
    <>
      <Card className="max-h-[calc(100vh-320px)] overflow-auto">
        <CardContent className="pt-6 space-y-8">
          {collateralTokens !== undefined ? (
            <TableEditable title="Collateral">
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right pr-6">Forbidden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collateralTokens.map((collateralToken) => (
                  <TableRow key={collateralToken.address}>
                    <TableCellAsset
                      assetAddress={collateralToken.address}
                      symbol={collateralToken.symbol}
                      comment={
                        collateralToken.address ===
                        market.pool.underlying.toLowerCase()
                          ? "underlying"
                          : undefined
                      }
                      explorerUrl={chain?.blockExplorers.default.url}
                    />

                    <TableCellUpdatable
                      className={`text-right ${collateralToken.forbidden ? "pr-6" : ""}`}
                      disabled={collateralToken.forbidden}
                      newValue={collateralToken.forbidden ? "Yes" : "No"}
                      isEditable={!collateralToken.forbidden}
                      customButton={
                        <Link
                          key={`${chainId}-${marketConfigurator}-forbidToken`}
                          href={{
                            pathname: "/emergency/tx",
                            query: {
                              chainId: chainId,
                              mc: marketConfigurator,
                              action: "CREDIT::forbidToken",
                              params: JSON.stringify({
                                creditManager:
                                  creditSuite.creditManager.address,
                                token: collateralToken.address,
                              }),
                            },
                          }}
                        >
                          <Button variant={"pink"} size={"xs"}>
                            Forbid
                          </Button>
                        </Link>
                      }
                    />
                  </TableRow>
                ))}
              </TableBody>
            </TableEditable>
          ) : (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="font-bold">Collateral</CardTitle>
              </CardHeader>
              {isLoading ? (
                <div className="space-y-2 p-4 animate-pulse">
                  <div className="h-6 w-full bg-muted rounded" />
                  <div className="h-6 w-full bg-muted rounded" />
                  <div className="h-6 w-full bg-muted rounded" />
                </div>
              ) : error ? (
                <div className="space-y-2 p-4">
                  Something went wrong loading collaterals: {error.message}
                </div>
              ) : (
                <></>
              )}
            </Card>
          )}

          <TableEditable title="Adapters">
            <TableHeader>
              <TableRow>
                <TableHead>Protocol</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Adapter</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditSuite.creditManager.adapters
                .entries()
                .map(([address, adapter]) => (
                  <TableRow key={address}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {shortenHash(adapter.targetContract, 6)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-white p-0 h-auto"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              adapter.targetContract
                            );
                            toast.success("Address copied to clipboard");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        {chain?.blockExplorers.default.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-white p-0 h-auto"
                            onClick={() =>
                              window.open(
                                `${chain?.blockExplorers.default.url}/address/${adapter.targetContract}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {adapter.contractType.replace("ADAPTER::", "")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {shortenHash(address, 6)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-white p-0 h-auto"
                          onClick={() => {
                            navigator.clipboard.writeText(address);
                            toast.success("Address copied to clipboard");
                          }}
                        >
                          <Copy className="h-3 w-3" />
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
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link
                        key={`${chainId}-${marketConfigurator}-forbidAdapter`}
                        href={{
                          pathname: "/emergency/tx",
                          query: {
                            chainId: chainId,
                            mc: marketConfigurator,
                            action: "CREDIT::forbidAdapter",
                            params: JSON.stringify({
                              creditManager: creditSuite.creditManager.address,
                              adapter: address,
                            }),
                          },
                        }}
                      >
                        <Button variant={"pink"} size={"xs"}>
                          Forbid
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </TableEditable>

          <TableEditable
            title={"Other params"}
            customButton={
              creditSuite.creditFacade.isPaused ? (
                <Button variant={"pink"} size={`sm`} disabled>
                  Сredit manager paused
                </Button>
              ) : (
                <Link
                  key={`${chainId}-${marketConfigurator}-creditPause`}
                  href={{
                    pathname: "/emergency/tx",
                    query: {
                      chainId: chainId,
                      mc: marketConfigurator,
                      action: "CREDIT::pause",
                      params: JSON.stringify({
                        creditManager: creditSuite.creditManager.address,
                      }),
                    },
                  }}
                >
                  <Button variant={"pink"} size={`sm`}>
                    Pause credit manager
                  </Button>
                </Link>
              )
            }
          >
            <TableHeader>
              <TableRow>
                <TableHead>Parameter</TableHead>
                <TableHead className="text-right pr-6">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debtLimit !== undefined && (
                <TableRow>
                  <TableCell className="font-medium">
                    Total Debt Limit
                  </TableCell>
                  <TableCellUpdatable
                    className={`text-right ${debtLimit === 0 ? "pr-6" : ""}`}
                    newValue={debtLimit.toString()}
                    postfix={sdk.tokensMeta.symbol(market.pool.underlying)}
                    nowrap
                    isEditable={debtLimit > 0}
                    customButton={
                      <Link
                        key={`${chainId}-${marketConfigurator}-setCreditManagerDebtLimitToZero`}
                        href={{
                          pathname: "/emergency/tx",
                          query: {
                            chainId: chainId,
                            mc: marketConfigurator,
                            action: "POOL::setCreditManagerDebtLimitToZero",
                            params: JSON.stringify({
                              pool: market.pool.pool.address,
                              creditManager: creditSuite.creditManager.address,
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
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-medium">
                  Is Borrowing Allowed
                </TableCell>
                <TableCellUpdatable
                  className={`text-right ${creditSuite.creditFacade.maxDebtPerBlockMultiplier === 0 ? "pr-6" : ""}`}
                  newValue={
                    creditSuite.creditFacade.maxDebtPerBlockMultiplier > 0
                      ? "Yes"
                      : "No"
                  }
                  isEditable={
                    creditSuite.creditFacade.maxDebtPerBlockMultiplier > 0
                  }
                  customButton={
                    <Link
                      key={`${chainId}-${marketConfigurator}-forbidBorrowing`}
                      href={{
                        pathname: "/emergency/tx",
                        query: {
                          chainId: chainId,
                          mc: marketConfigurator,
                          action: "CREDIT::forbidBorrowing",
                          params: JSON.stringify({
                            creditManager: creditSuite.creditManager.address,
                          }),
                        },
                      }}
                    >
                      <Button variant={"pink"} size={"xs"}>
                        Forbid
                      </Button>
                    </Link>
                  }
                />
              </TableRow>
            </TableBody>
          </TableEditable>
        </CardContent>
      </Card>
    </>
  );
}
