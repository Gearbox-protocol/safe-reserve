"use client";

import { Button } from "@/components/ui/button";
import { AccessMode } from "@/core/emergency-actions";
import { getLossPolicyState } from "@/utils/state";
import { MarketSuite } from "@gearbox-protocol/sdk";
import Link from "next/link";
import { useMemo } from "react";
import { Address } from "viem";

const ACCESS_MODE_TITLE: Record<AccessMode, string> = {
  [AccessMode.Forbidden]: "Nobody",
  [AccessMode.Permissioned]: "Whitelisted",
  [AccessMode.Permissionless]: "All",
};

export function LiquidationSettings({
  chainId,
  marketConfigurator,
  market,
  size = "sm",
}: {
  chainId: number;
  marketConfigurator: Address;
  market: MarketSuite;
  size?: "default" | "xs" | "sm" | "lg" | null;
}) {
  const lossPolicyState = useMemo(
    () => getLossPolicyState(market.state.lossPolicy.baseParams),
    [market]
  );

  return (
    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3 w-full max-w-[450px]">
      {Object.values(AccessMode)
        .filter((m) => typeof m === "number")
        .map((accessMode) => {
          if (accessMode === lossPolicyState.state?.accessMode) {
            return (
              <Button
                size={size}
                variant={"outline"}
                disabled
                className="w-full border-green-500 text-green-500 disabled:opacity-100"
                key={`selected-${accessMode}`}
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
              <Button size={size} variant={"outline"} className="w-full">
                {ACCESS_MODE_TITLE[accessMode]}
              </Button>
            </Link>
          );
        })}
    </div>
  );
}
