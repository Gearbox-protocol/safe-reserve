import { MultiPuaseContract } from "@/bindings/multi-pause";
import { addressSchema } from "@/utils/validation";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface PauseMarketParams {
  pool: Address;
}

export type PauseMarketAction = BaseEmergencyAction<
  "MULTI_PAUSE::pauseMarket",
  PauseMarketParams
>;

export const pauseMarketActionData: EmergencyActionData<PauseMarketAction> = {
  type: "MULTI_PAUSE::pauseMarket",
  description:
    "Pauses all contracts within a given market and connected credit suites",
  schema: z.object({
    pool: addressSchema,
  }),
  getRawTx: async ({ mc, action }) => {
    const { params } = action;
    const pause = await mc.multipause();
    if (!pause) {
      throw new Error("Missing multipause");
    }
    const multipause = new MultiPuaseContract(pause, mc.client);

    const tx = multipause.pauseMarket(params.pool);
    return { tx, action };
  },
};
