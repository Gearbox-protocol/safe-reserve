import { iCreditEmergencyConfigureActionsAbi } from "@/abi";
import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface ForbidTokenParams {
  creditManager: Address;
  token: Address;
}

export type ForbidTokenAction = BaseEmergencyAction<
  "CREDIT::forbidToken",
  ForbidTokenParams
>;

export const forbidTokenActionData: EmergencyActionData<ForbidTokenAction> = {
  type: "CREDIT::forbidToken",
  description: "Forbid token in credit manager",
  schema: z.object({
    creditManager: addressSchema,
    token: addressSchema,
  }),

  getRawTx: ({ mc, action }) => {
    const { params } = action;

    const tx = mc.emergencyConfigureCreditSuite(
      params.creditManager,
      createCallData(iCreditEmergencyConfigureActionsAbi, {
        functionName: "forbidToken",
        args: [params.token],
      })
    );

    return { tx, action };
  },
};
