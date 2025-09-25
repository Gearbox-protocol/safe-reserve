import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { iLossPolicyV310Abi } from "@gearbox-protocol/sdk/abi";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface SetChecksEnabledParams {
  pool: Address;
  enabled: boolean;
}

export type SetChecksEnabledAction = BaseEmergencyAction<
  "LOSS_POLICY::setChecksEnabled",
  SetChecksEnabledParams
>;

export const setChecksEnabledActionData: EmergencyActionData<SetChecksEnabledAction> =
  {
    type: "LOSS_POLICY::setChecksEnabled",
    description: "Enables or disables loss policy checks",
    schema: z.object({
      pool: addressSchema,
      enabled: z.boolean(),
    }),

    getRawTx: async ({ mc, action }) => {
      const { params } = action;

      const tx = mc.emergencyConfigureLossPolicy(
        params.pool,
        createCallData(iLossPolicyV310Abi, {
          functionName: "setChecksEnabled",
          args: [params.enabled],
        })
      );

      return { tx, action };
    },
  };
