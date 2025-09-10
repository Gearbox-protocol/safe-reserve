import { iPriceOracleEmergencyConfigureActionsAbi } from "@/abi";
import { addressSchema } from "@/utils/validation";
import { createCallData } from "@gearbox-protocol/permissionless";
import { Address } from "viem";
import { z } from "zod";
import { BaseEmergencyAction, EmergencyActionData } from "../types";

export interface SetPriceFeedParams {
  priceOracle: Address;
  priceFeed: Address;
  token: Address;
}

export type SetPriceFeedAction = BaseEmergencyAction<
  "ORACLE::setPriceFeed",
  SetPriceFeedParams
>;

export const setPriceFeedActionData: EmergencyActionData<SetPriceFeedAction> = {
  type: "ORACLE::setPriceFeed",
  description: "Set main price feed for token",
  schema: z.object({
    priceOracle: addressSchema,
    priceFeed: addressSchema,
    token: addressSchema,
  }),

  getRawTx: ({ mc, action }) => {
    const { params } = action;

    const tx = mc.emergencyConfigureLossPolicy(
      params.priceOracle,
      createCallData(iPriceOracleEmergencyConfigureActionsAbi, {
        functionName: "setPriceFeed",
        args: [params.token, params.priceFeed],
      })
    );

    return { tx, action };
  },
};
