import { iPoolEmergencyConfigureActionsAbi } from "@/abi";
import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "./types";

export interface PauseParams {
  pool: Address;
}

export type PoolPauseAction = BaseEmergencyAction<"POOL::pause", PauseParams>;

export const poolPauseActionData: EmergencyActionData<PoolPauseAction> = {
  type: "POOL::pause",
  description: "Pause pool",
  schema: z.object({
    pool: addressSchema,
  }),

  getRawTx: ({ mc, action }) => {
    const { params } = action;

    const tx = mc.emergencyConfigurePool(
      params.pool,
      createCallData(iPoolEmergencyConfigureActionsAbi, {
        functionName: "pause",
      })
    );

    return { tx, action };
  },
};
