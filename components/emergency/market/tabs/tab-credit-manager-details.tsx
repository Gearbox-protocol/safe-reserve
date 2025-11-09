import { chains } from "@/config/wagmi";
import { useGetCollateralStatuses } from "@/hooks";
import {
  Button,
  Card,
  CardContent,
  CardTitle,
  CopyButton,
  ExternalButton,
  Skeleton,
  TableBody,
  TableCell,
  TableCellAsset,
  TableCellUpdatable,
  TableEditable,
  TableHead,
  TableHeader,
  TableRow,
} from "@gearbox-protocol/permissionless-ui";
import { CreditSuite } from "@gearbox-protocol/sdk";
import { shortenHash } from "@gearbox-protocol/sdk/permissionless";
import { CirclePause } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
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

    return limit !== undefined
      ? Number(formatUnits(limit, underlyingDecimals))
      : undefined;
  }, [sdk, market, creditSuite]);

  return (
    <div className="space-y-6">
      {creditSuite.creditFacade.isPaused && (
        <Card className="border-destructive p-6">
          <div className="flex items-center gap-2 text-destructive">
            <CirclePause className="h-8 w-8" />
            <CardTitle>Credit manager paused</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground/80 ml-10">
            This credit manager is temporarily paused
          </p>
        </Card>
      )}

      <Card className="max-h-[calc(100vh-320px)] overflow-auto">
        <CardContent className="pt-6 space-y-8">
          {collateralTokens !== undefined ? (
            <TableEditable title="Collateral">
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right pr-8">Forbidden</TableHead>
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
                      className={`text-right ${collateralToken.forbidden ? "pr-8" : ""}`}
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
                          <Button variant={"destructive"} size={"xs"}>
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
              <CardContent>
                <span className="text-2xl font-bold">Collateral</span>
                {isLoading ? (
                  <div className="space-y-2 pt-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : error ? (
                  <div className="space-y-2 pt-4">
                    Something went wrong loading collaterals: {error.message}
                  </div>
                ) : (
                  <></>
                )}
              </CardContent>
            </Card>
          )}

          <TableEditable title="Adapters">
            <TableHeader>
              <TableRow>
                <TableHead>Protocol</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Adapter</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditSuite.creditManager.adapters
                .entries()
                .map(([target, adapter]) => (
                  <TableRow key={target}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {shortenHash(adapter.targetContract, 6)}
                        <CopyButton text={adapter.targetContract} />
                        {chain?.blockExplorers.default.url && (
                          <ExternalButton
                            url={`${chain.blockExplorers.default.url}/address/${adapter.targetContract}`}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {adapter.contractType.replace("ADAPTER::", "")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {shortenHash(adapter.address, 6)}
                        <CopyButton text={adapter.address} />
                        {chain?.blockExplorers.default.url && (
                          <ExternalButton
                            url={`${chain.blockExplorers.default.url}/address/${adapter.address}`}
                          />
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
                              adapter: adapter.address,
                            }),
                          },
                        }}
                      >
                        <Button variant={"destructive"} size={"xs"}>
                          Forbid
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </TableEditable>

          <TableEditable title={"Other params"}>
            <TableHeader>
              <TableRow>
                <TableHead>Parameter</TableHead>
                <TableHead className="text-right pr-8">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debtLimit !== undefined && (
                <TableRow>
                  <TableCell className="font-medium">
                    Total Debt Limit
                  </TableCell>
                  <TableCellUpdatable
                    className={`text-right ${debtLimit === 0 ? "pr-8" : ""}`}
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
                        <Button variant={"destructive"} size={"xs"}>
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
                  className={`text-right ${creditSuite.creditFacade.maxDebtPerBlockMultiplier === 0 ? "pr-8" : ""}`}
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
                      <Button variant={"destructive"} size={"xs"}>
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
    </div>
  );
}
