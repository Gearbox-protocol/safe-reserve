import { MultiPuaseContract } from "@/bindings/multi-pause";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export type PauseAllAction = BaseEmergencyAction<
  "MULTI_PAUSE::pauseAll",
  Record<string, never>
>;

export const pauseAllActionData: EmergencyActionData<PauseAllAction> = {
  type: "MULTI_PAUSE::pauseAll",
  description:
    "Pauses all contracts within all registered markets and credit suites",
  schema: z.object({}),
  getRawTx: async ({ mc, action }) => {
    const pause = await mc.multipause();
    if (!pause) {
      throw new Error("Missing multipause");
    }
    const multipause = new MultiPuaseContract(pause, mc.client);

    const tx = multipause.pauseAllContracts();
    return { tx, action };
  },
};
