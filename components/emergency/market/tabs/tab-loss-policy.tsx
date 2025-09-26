import { LiquidationSettings } from "@/components/emergency/liquidations-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
import { getLossPolicyState } from "@/utils/state";
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
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="font-bold">{`Loss Policy: ${lossPolicyState.type.replace("LOSS_POLICY::", "")}`}</CardTitle>
              </CardHeader>

              <div className="space-y-2 p-4">Unknown loss policy type</div>
            </Card>
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
