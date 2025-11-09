import { LiquidationSettings } from "@/components/emergency/liquidations-settings";
import { getLossPolicyState } from "@/utils/state";
import {
  Button,
  Card,
  CardContent,
  TableBody,
  TableCell,
  TableCellUpdatable,
  TableEditable,
  TableHead,
  TableHeader,
  TableRow,
} from "@gearbox-protocol/permissionless-ui";
import Link from "next/link";
import { useMemo } from "react";
import { MarketProps } from "./types";

export function LossPolicyTab({
  chainId,
  marketConfigurator,
  market,
}: MarketProps) {
  const lossPolicyState = useMemo(
    () => getLossPolicyState(market.state.lossPolicy.baseParams),
    [market]
  );

  return (
    <>
      <Card className="max-h-[calc(100vh-320px)] overflow-auto">
        <CardContent className="pt-6 space-y-8">
          {lossPolicyState.state === undefined ? (
            <div>
              <span className="text-2xl font-bold">{`Loss Policy: ${lossPolicyState.type.replace("LOSS_POLICY::", "")}`}</span>
              <div className="text-muted-foreground text-sm">
                Unknown loss policy type
              </div>
            </div>
          ) : (
            <TableEditable
              title={`Loss Policy: ${lossPolicyState.type.replace("LOSS_POLICY::", "")}`}
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead className="text-right pr-8">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex gap-2">
                      <div> Emergency liqudations </div>
                      <div className="text-muted-foreground text-sm">
                        (Access Mode)
                      </div>
                    </div>
                  </TableCell>
                  <TableCellUpdatable
                    className="py-0"
                    newValue={""}
                    customButton={
                      <LiquidationSettings
                        chainId={chainId}
                        marketConfigurator={marketConfigurator}
                        market={market}
                      />
                    }
                  />
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Enabled Checks</TableCell>
                  <TableCellUpdatable
                    newValue={
                      lossPolicyState.state.checksEnabled ? "Yes" : "No"
                    }
                    customButton={
                      <Link
                        key={`${chainId}-${marketConfigurator}-setChecksEnabled`}
                        href={{
                          pathname: "/emergency/tx",
                          query: {
                            chainId: chainId,
                            mc: marketConfigurator,
                            action: "LOSS_POLICY::setChecksEnabled",
                            params: JSON.stringify({
                              pool: market.pool.pool.address,
                              enabled: !lossPolicyState.state.checksEnabled,
                            }),
                          },
                        }}
                      >
                        <Button variant={"destructive"} size={"xs"}>
                          {lossPolicyState.state.checksEnabled
                            ? "Disable"
                            : "Enable"}
                        </Button>
                      </Link>
                    }
                  />
                </TableRow>
              </TableBody>
            </TableEditable>
          )}
        </CardContent>
      </Card>
    </>
  );
}
