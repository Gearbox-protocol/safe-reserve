import { SetChecksEnabledAction } from "@/core/emergency-actions";
import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useMemo } from "react";
import { AddressParamsView } from "./address-param";

export function SetChecksEnabledParamsView({
  sdk,
  action,
}: {
  sdk: GearboxSDK;
  action: SetChecksEnabledAction;
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
      <div className="grid grid-cols-[140px_auto] gap-2 font-mono">
        <div className="text-gray-400 font-semibold">enabled:</div>
        <div className="break-all text-gray-100">
          {action.params.enabled ? "True" : "False"}
        </div>
      </div>
    </div>
  );
}
