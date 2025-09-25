import {
  ForbidAdapterAction,
  forbidAdapterActionData,
} from "./credit/credit-forbid-adapter";
import {
  ForbidBorrowingAction,
  forbidBorrowingActionData,
} from "./credit/credit-forbid-borrowing";
import {
  ForbidTokenAction,
  forbidTokenActionData,
} from "./credit/credit-forbid-token";
import {
  CreditPauseAction,
  creditPauseActionData,
} from "./credit/credit-pause";
import {
  AccessMode,
  SetAccessModeAction,
  setAccessModeActionData,
} from "./loss-policy/loss-policy-set-access-mode";
import {
  SetChecksEnabledAction,
  setChecksEnabledActionData,
} from "./loss-policy/loss-policy-set-checks-enabled";
import {
  PauseAllAction,
  pauseAllActionData,
} from "./multi-pause/multi-pause-pause-all";
import {
  PauseMarketAction,
  pauseMarketActionData,
} from "./multi-pause/multi-pause-pause-market";
import {
  SetPriceFeedAction,
  setPriceFeedActionData,
} from "./oracle/oracle-set-price-feed";
import { PoolPauseAction, poolPauseActionData } from "./pool/pool-pause";
import {
  SetCreditManagerDebtLimitToZeroAction,
  setCreditManagerDebtLimitToZeroActionData,
} from "./pool/pool-set-credit-manager-debt-limit-to-zero";
import {
  SetTokenLimitToZeroAction,
  setTokenLimitToZeroActionData,
} from "./pool/pool-set-token-limit-to-zero";
import { EmergencyActionData, EmergencyTx } from "./types";

export type EmergencyActions =
  // Pool domain
  | SetTokenLimitToZeroAction
  | PoolPauseAction
  | SetCreditManagerDebtLimitToZeroAction
  // Credit domain
  | ForbidTokenAction
  | ForbidAdapterAction
  | ForbidBorrowingAction
  | CreditPauseAction
  // Oracle domain
  | SetPriceFeedAction
  // Loss Policy domain
  | SetAccessModeAction
  | SetChecksEnabledAction
  // Multi Pause domain
  | PauseAllAction
  | PauseMarketAction;

export type EmergencyActionsType = EmergencyActions["type"];

export const emergencyActionsData = [
  // Pool domain
  setTokenLimitToZeroActionData,
  poolPauseActionData,
  setCreditManagerDebtLimitToZeroActionData,
  // Credit domain
  forbidTokenActionData,
  forbidAdapterActionData,
  forbidBorrowingActionData,
  creditPauseActionData,
  // Oracle domain
  setPriceFeedActionData,
  // Loss Policy domain
  setAccessModeActionData,
  setChecksEnabledActionData,
  // Multi Pause domain
  pauseAllActionData,
  pauseMarketActionData,
];

export const emergencyActionsMap = emergencyActionsData.reduce(
  (acc, action) => {
    acc[action.type] = action as EmergencyActionData<EmergencyActions>;
    return acc;
  },
  {} as Record<EmergencyActions["type"], EmergencyActionData<EmergencyActions>>
);

export function validateEmergencyAction(action: {
  type: string;
  params: unknown;
}): EmergencyActions {
  const { type } = action;

  const EmergencyActionProcessor =
    emergencyActionsMap[type as EmergencyActionsType];
  if (!EmergencyActionProcessor) {
    throw new Error("Emergency action type not found");
  }

  const schema = EmergencyActionProcessor.schema;

  const params = schema.parse(action.params);
  return {
    type,
    params,
  } as EmergencyActions;
}

export { AccessMode };

export type {
  CreditPauseAction,
  EmergencyTx,
  ForbidAdapterAction,
  ForbidBorrowingAction,
  ForbidTokenAction,
  PoolPauseAction,
  SetAccessModeAction,
  SetChecksEnabledAction,
  SetCreditManagerDebtLimitToZeroAction,
  SetPriceFeedAction,
  SetTokenLimitToZeroAction,
};
