import { z } from "zod";

// Validation schemas
export const addressSchema = z
  .string()
  .min(42, "Ethereum address must be 42 characters long")
  .max(42, "Ethereum address must be 42 characters long")
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

export const contractMethodSchema = z.object({
  inputs: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      internalType: z.string(),
    })
  ),
  name: z.string(),
  payable: z.boolean(),
});

export const safeTxSchema = z.object({
  to: addressSchema,
  value: z.string(),
  data: z.string(),
  contractMethod: contractMethodSchema,
  contractInputsValues: z.record(z.string(), z.string()),
});

export const timelockTxsSchema = z.object({
  chainId: z.number(),
  eta: z.number(),
  author: addressSchema,
  marketConfigurator: addressSchema,
  createdAtBlock: z.number(),
  queueBatches: z.array(z.array(safeTxSchema)),
  batchesEstimatedGas: z.array(z.number()),
  signature: z.string().optional(),
});
