import { iCreditEmergencyConfigureActionsAbi } from "@/abi";
import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/sdk/permissionless";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface CreditPauseParams {
  creditManager: Address;
}

export type CreditPauseAction = BaseEmergencyAction<
  "CREDIT::pause",
  CreditPauseParams
>;

export const creditPauseActionData: EmergencyActionData<CreditPauseAction> = {
  type: "CREDIT::pause",
  description: "Pause credit manager",
  schema: z.object({
    creditManager: addressSchema,
  }),

  getRawTx: async ({ mc, action }) => {
    const { params } = action;

    const tx = mc.emergencyConfigureCreditSuite(
      params.creditManager,
      createCallData(iCreditEmergencyConfigureActionsAbi, {
        functionName: "pause",
      })
    );

    return { tx, action };
  },
};
