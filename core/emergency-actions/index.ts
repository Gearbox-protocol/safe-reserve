import { PoolPauseAction, poolPauseActionData } from "./pool-pause";
import {
  SetCreditManagerDebtLimitToZeroAction,
  setCreditManagerDebtLimitToZeroActionData,
} from "./pool-set-credit-manager-debt-limit-to-zero";
import {
  SetTokenLimitToZeroAction,
  setTokenLimitToZeroActionData,
} from "./pool-set-token-limit-to-zero";
import { EmergencyActionData } from "./types";

export type EmergencyActions =
  // Pool domain
  | SetTokenLimitToZeroAction
  | PoolPauseAction
  | SetCreditManagerDebtLimitToZeroAction;

export type EmergencyActionsType = EmergencyActions["type"];

export const emergencyActionsData = [
  // Pool domain
  setTokenLimitToZeroActionData,
  poolPauseActionData,
  setCreditManagerDebtLimitToZeroActionData,
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
