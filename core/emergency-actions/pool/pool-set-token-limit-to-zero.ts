import { iPoolEmergencyConfigureActionsAbi } from "@/abi";
import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface SetTokenLimitToZeroParams {
  pool: Address;
  token: Address;
}

export type SetTokenLimitToZeroAction = BaseEmergencyAction<
  "POOL::setTokenLimitToZero",
  SetTokenLimitToZeroParams
>;

export const setTokenLimitToZeroActionData: EmergencyActionData<SetTokenLimitToZeroAction> =
  {
    type: "POOL::setTokenLimitToZero",
    description: "Set particular token limit to zero",
    schema: z.object({
      pool: addressSchema,
      token: addressSchema,
    }),

    getRawTx: async ({ mc, action }) => {
      const { params } = action;

      const tx = mc.emergencyConfigurePool(
        params.pool,
        createCallData(iPoolEmergencyConfigureActionsAbi, {
          functionName: "setTokenLimitToZero",
          args: [params.token],
        })
      );

      return { tx, action };
    },
  };
