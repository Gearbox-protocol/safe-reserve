import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { iLossPolicyV310Abi } from "@gearbox-protocol/sdk/abi";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export enum AccessMode {
  Permissionless = 0,
  Permissioned = 1,
  Forbidden = 2,
}

export interface SetAccessModeParams {
  lossPolicy: Address;
  mode: AccessMode;
}

export type SetAccessModeAction = BaseEmergencyAction<
  "LOSS_POLICY::setAccessMode",
  SetAccessModeParams
>;

export const setAccessModeActionData: EmergencyActionData<SetAccessModeAction> =
  {
    type: "LOSS_POLICY::setAccessMode",
    description: "Set loss policy access mode for liquidations",
    schema: z.object({
      lossPolicy: addressSchema,
      mode: z.nativeEnum(AccessMode),
    }),

    getRawTx: ({ mc, action }) => {
      const { params } = action;

      const tx = mc.emergencyConfigureLossPolicy(
        params.lossPolicy,
        createCallData(iLossPolicyV310Abi, {
          functionName: "setAccessMode",
          args: [params.mode],
        })
      );

      return { tx, action };
    },
  };
