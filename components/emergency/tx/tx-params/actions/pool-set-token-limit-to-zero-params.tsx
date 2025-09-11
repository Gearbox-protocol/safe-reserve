import { SetTokenLimitToZeroAction } from "@/core/emergency-actions";
import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useMemo } from "react";
import { AddressParamsView } from "./address-param";

export function SetTokenLimitToZeroParamsView({
  sdk,
  action,
}: {
  sdk: GearboxSDK;
  action: SetTokenLimitToZeroAction;
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
      <AddressParamsView
        sdk={sdk}
        address={action.params.token}
        title="token"
        description={sdk.tokensMeta.symbol(action.params.token)}
      />
    </div>
  );
}
