import { iCreditEmergencyConfigureActionsAbi } from "@/abi";
import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface ForbidAdapterParams {
  creditManager: Address;
  adapter: Address;
}

export type ForbidAdapterAction = BaseEmergencyAction<
  "CREDIT::forbidAdapter",
  ForbidAdapterParams
>;

export const forbidAdapterActionData: EmergencyActionData<ForbidAdapterAction> =
  {
    type: "CREDIT::forbidAdapter",
    description: "Forbid adapter in credit manager",
    schema: z.object({
      creditManager: addressSchema,
      adapter: addressSchema,
    }),

    getRawTx: async ({ mc, action }) => {
      const { params } = action;

      const tx = mc.emergencyConfigureCreditSuite(
        params.creditManager,
        createCallData(iCreditEmergencyConfigureActionsAbi, {
          functionName: "forbidAdapter",
          args: [params.adapter],
        })
      );

      return { tx, action };
    },
  };
