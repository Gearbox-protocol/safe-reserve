import { PoolPauseAction } from "@/core/emergency-actions";
import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useMemo } from "react";
import { AddressParamsView } from "./address-param";

export function PoolPauseParams({
  sdk,
  action,
}: {
  sdk: GearboxSDK;
  action: PoolPauseAction;
}) {
  const marketSuite = useMemo(
    () => sdk.marketRegister.findByPool(action.params.pool),
    [sdk, action]
  );

  return (
    <div className="space-y-2">
      <AddressParamsView
        sdk={sdk}
        address={action.params.pool}
        title="pool"
        description={`${marketSuite.pool.pool.symbol} market`}
      />
    </div>
  );
}
