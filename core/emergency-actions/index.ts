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
  SetAccessModeAction,
  setAccessModeActionData,
} from "./loss-policy/loss-policy-set-access-mode";
import {
  SetChecksEnabledAction,
  setChecksEnabledActionData,
} from "./loss-policy/loss-policy-set-checks-enabled";
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
import { EmergencyActionData } from "./types";

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
  | SetChecksEnabledAction;

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
