import { MarketConfiguratorContract } from "@gearbox-protocol/permissionless";
import { RawTx } from "@gearbox-protocol/sdk";
import { z } from "zod";
import { EmergencyActions } from ".";

export type BaseEmergencyAction<T extends string, P extends object> = {
  type: T;
  params: P;
};

export interface EmergencyTx {
  tx: RawTx;
  action: EmergencyActions;
}

export interface EmergencyActionData<
  A extends BaseEmergencyAction<string, object>,
> {
  type: A["type"];
  name?: string;
  schema: z.ZodSchema;
  description: string;

  getRawTx: (params: {
    mc: MarketConfiguratorContract;
    action: A;
  }) => Promise<EmergencyTx>;
}
