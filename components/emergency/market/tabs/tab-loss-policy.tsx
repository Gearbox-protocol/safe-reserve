import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { AccessMode } from "@/core/emergency-actions";
import Link from "next/link";
import { useMemo } from "react";
import { decodeAbiParameters, hexToString } from "viem";
import { MarketProps } from "./types";

const MODE_METADATA: Record<AccessMode, { title: string; color: string }> = {
  [AccessMode.Forbidden]: {
    title: "Forbidden",
    color: "bg-red-500",
  },
  [AccessMode.Permissioned]: {
    title: "Permissioned",
    color: "bg-blue-500",
  },
  [AccessMode.Permissionless]: {
    title: "Permissionless",
    color: "bg-green-500",
  },
};

const getStatusComponent = (s: AccessMode) => (
  <div className="flex items-center gap-2">
    <span
      className={`inline-flex items-center justify-center rounded-full ${MODE_METADATA[s].color} w-2 h-2`}
    />
    {MODE_METADATA[s].title}
  </div>
);

export function LossPolicyTab({
  chainId,
  marketConfigurator,
  market,
}: MarketProps) {
  const lossPolicyState = useMemo(() => {
    const lossPolicy = market.state.lossPolicy.baseParams.addr;
    const type = hexToString(market.state.lossPolicy.baseParams.contractType, {
      size: 32,
    });

    switch (type) {
      case "LOSS_POLICY::ALIASED": {
        const decoded = decodeAbiParameters(
          [
            { name: "accessMode", type: "uint8" },
            { name: "checksEnabled", type: "bool" },
            { name: "tokens", type: "address[]" },
            {
              name: "priceFeedParams",
              type: "tuple[]",
              components: [
                { name: "priceFeed", type: "address" },
                { name: "stalenessPeriod", type: "uint32" },
                { name: "skipCheck", type: "bool" },
                { name: "tokenDecimals", type: "uint8" },
              ],
            },
          ],
          market.state.lossPolicy.baseParams.serializedParams
        );

        const [accessModeRaw, checksEnabled] = decoded;

        return {
          lossPolicy,
          type,
          state: {
            accessMode: Number(accessModeRaw) as AccessMode,
            checksEnabled,
          },
        };
      }

      default:
        return {
          lossPolicy,
          type,
          state: undefined,
        };
    }
  }, [market]);

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
                  <TableHead className="text-right pr-6">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Access Mode</TableCell>
                  <TableCellUpdatable
                    newValue={AccessMode[lossPolicyState.state.accessMode]}
                    customButton={
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button size="xs" variant={"pink"}>
                            Change
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Set mode:</DropdownMenuLabel>
                            {Object.values(AccessMode)
                              .filter(
                                (m) =>
                                  typeof m === "number" &&
                                  m !== lossPolicyState.state.accessMode
                              )
                              .map((m) => (
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
                                        mode: m,
                                      }),
                                    },
                                  }}
                                >
                                  <DropdownMenuItem key={m}>
                                    {getStatusComponent(m as AccessMode)}
                                  </DropdownMenuItem>
                                </Link>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenuPortal>
                      </DropdownMenu>
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
                        <Button variant={"pink"} size={"xs"}>
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
