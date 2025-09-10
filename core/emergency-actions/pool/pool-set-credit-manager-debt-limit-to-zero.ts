import { iPoolEmergencyConfigureActionsAbi } from "@/abi";
import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface SetCreditManagerDebtLimitToZeroParams {
  pool: Address;
  creditManager: Address;
}

export type SetCreditManagerDebtLimitToZeroAction = BaseEmergencyAction<
  "POOL::setCreditManagerDebtLimitToZero",
  SetCreditManagerDebtLimitToZeroParams
>;

export const setCreditManagerDebtLimitToZeroActionData: EmergencyActionData<SetCreditManagerDebtLimitToZeroAction> =
  {
    type: "POOL::setCreditManagerDebtLimitToZero",
    description: "Set credit manager debt limit to zero",
    schema: z.object({
      pool: addressSchema,
      creditManager: addressSchema,
    }),

    getRawTx: ({ mc, action }) => {
      const { params } = action;

      const tx = mc.emergencyConfigurePool(
        params.pool,
        createCallData(iPoolEmergencyConfigureActionsAbi, {
          functionName: "setCreditManagerDebtLimitToZero",
          args: [params.creditManager],
        })
      );

      return { tx, action };
    },
  };
