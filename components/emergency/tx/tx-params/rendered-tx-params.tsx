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

export function RenderedParams({ action }: { action: EmergencyActions }) {
  switch (action.type) {
    case "POOL::pause":
      return <PoolPauseParams action={action} />;
    case "POOL::setTokenLimitToZero":
      return <SetTokenLimitToZeroParamsView action={action} />;
    case "POOL::setCreditManagerDebtLimitToZero":
      return <SetCreditManagerDebtLimitToZeroParamsView action={action} />;

    case "CREDIT::forbidToken":
      return <ForbidTokenParamsView action={action} />;
    case "CREDIT::forbidAdapter":
      return <ForbidAdapterParamsView action={action} />;
    case "CREDIT::forbidBorrowing":
      return <ForbidBorrowingParamsView action={action} />;
    case "CREDIT::pause":
      return <CreditPauseParamsView action={action} />;

    case "ORACLE::setPriceFeed":
      return <SetPriceFeedParamsView action={action} />;

    case "LOSS_POLICY::setAccessMode":
      return <SetAccessModeParamsView action={action} />;
    case "LOSS_POLICY::setChecksEnabled":
      return <SetChecksEnabledParamsView action={action} />;
    default:
      return null;
  }
}
