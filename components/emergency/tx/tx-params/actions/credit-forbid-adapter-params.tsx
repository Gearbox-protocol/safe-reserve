import { ForbidAdapterAction } from "@/core/emergency-actions";
import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useMemo } from "react";
import { AddressParamsView } from "./address-param";

export function ForbidAdapterParamsView({
  sdk,
  action,
}: {
  sdk: GearboxSDK;
  action: ForbidAdapterAction;
}) {
  const [creditSuite, adapter] = useMemo(() => {
    const cm = sdk.marketRegister.findCreditManager(
      action.params.creditManager
    );
    const adapter = cm.creditManager.adapters
      .values()
      .find(
        (a) => a.address.toLowerCase() === action.params.adapter.toLowerCase()
      );

    return [cm, adapter];
  }, [sdk, action]);

  return (
    <div className="space-y-2">
      <AddressParamsView
        sdk={sdk}
        address={action.params.creditManager}
        title="creditManager"
        description={creditSuite.name}
      />
      <AddressParamsView
        sdk={sdk}
        address={action.params.adapter}
        title="adapter"
        description={adapter?.contractType.replace("ADAPTER::", "")}
      />
    </div>
  );
}
