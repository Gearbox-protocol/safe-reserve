"use client";

import { EmergencyActions } from "@/core/emergency-actions";
import { ForbidAdapterParamsView } from "./actions/credit-forbid-adapter-params";
import { ForbidBorrowingParamsView } from "./actions/credit-forbid-borrowing-params";
import { ForbidTokenParamsView } from "./actions/credit-forbid-token-params";
import { CreditPauseParamsView } from "./actions/credit-pause-params";
import { SetAccessModeParamsView } from "./actions/loss-policy-set-access-mode-params";
import { SetChecksEnabledParamsView } from "./actions/loss-policy-set-checks-enabled-params";
import { SetPriceFeedParamsView } from "./actions/oracle-set-price-feed-params";
import { PoolPauseParams } from "./actions/pool-pause-params";
import { SetCreditManagerDebtLimitToZeroParamsView } from "./actions/pool-set-credit-manager-debt-limit-to-zero-params";
import { SetTokenLimitToZeroParamsView } from "./actions/pool-set-token-limit-to-zero-params";
import { GearboxSDK } from "@gearbox-protocol/sdk";

export function RenderedParams({
  sdk,
  action,
}: {
  sdk: GearboxSDK;
  action: EmergencyActions;
}) {
  switch (action.type) {
    case "POOL::pause":
      return <PoolPauseParams action={action} sdk={sdk}/>;
    case "POOL::setTokenLimitToZero":
      return <SetTokenLimitToZeroParamsView action={action} sdk={sdk}/>;
    case "POOL::setCreditManagerDebtLimitToZero":
      return <SetCreditManagerDebtLimitToZeroParamsView action={action} sdk={sdk}/>;

    case "CREDIT::forbidToken":
      return <ForbidTokenParamsView action={action} sdk={sdk}/>;
    case "CREDIT::forbidAdapter":
      return <ForbidAdapterParamsView action={action} sdk={sdk}/>;
    case "CREDIT::forbidBorrowing":
      return <ForbidBorrowingParamsView action={action} sdk={sdk}/>;
    case "CREDIT::pause":
      return <CreditPauseParamsView action={action} sdk={sdk}/>;

    case "ORACLE::setPriceFeed":
      return <SetPriceFeedParamsView action={action} sdk={sdk}/>;

    case "LOSS_POLICY::setAccessMode":
      return <SetAccessModeParamsView action={action} sdk={sdk}/>;
    case "LOSS_POLICY::setChecksEnabled":
      return <SetChecksEnabledParamsView action={action} sdk={sdk}/>;
    default:
      return null;
  }
}
