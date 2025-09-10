import { iCreditEmergencyConfigureActionsAbi } from "@/abi";
import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface ForbidBorrowingParams {
  creditManager: Address;
}

export type ForbidBorrowingAction = BaseEmergencyAction<
  "CREDIT::forbidBorrowing",
  ForbidBorrowingParams
>;

export const forbidBorrowingActionData: EmergencyActionData<ForbidBorrowingAction> =
  {
    type: "CREDIT::forbidBorrowing",
    description: "Forbid borrowing from credit manager",
    schema: z.object({
      creditManager: addressSchema,
    }),

    getRawTx: ({ mc, action }) => {
      const { params } = action;

      const tx = mc.emergencyConfigureCreditSuite(
        params.creditManager,
        createCallData(iCreditEmergencyConfigureActionsAbi, {
          functionName: "forbidBorrowing",
        })
      );

      return { tx, action };
    },
  };
