import { SetCreditManagerDebtLimitToZeroAction } from "@/core/emergency-actions";
import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useMemo } from "react";
import { AddressParamsView } from "./address-param";

export function SetCreditManagerDebtLimitToZeroParamsView({
  sdk,
  action,
}: {
  sdk: GearboxSDK;
  action: SetCreditManagerDebtLimitToZeroAction;
}) {
  const [marketSuite, creditSuite] = useMemo(
    () => [
      sdk.marketRegister.findByPool(action.params.pool),
      sdk.marketRegister.findCreditManager(action.params.creditManager),
    ],
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
        address={action.params.creditManager}
        title="creditManager"
        description={creditSuite.name}
      />
    </div>
  );
}
