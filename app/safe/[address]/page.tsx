"use server";

import { SafeView } from "@/components/safe/view-tx-list";
import { Address } from "viem";
import { SafeTx } from "@/core/safe-tx";
import { z } from "zod";

const addressSchema = z
  .string()
  .min(42, "Ethereum address must be 42 characters long")
  .max(42, "Ethereum address must be 42 characters long")
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

export default async function ProposalsListPage({
  params,
}: {
  params: { address: Address };
}) {
  const proposals: SafeTx[] = [];

  try {
    const address = addressSchema.parse(params.address) as Address;
    return <SafeView safeAddress={address} executedProposals={proposals} />;
  } catch {
    return <div>Invalid safe address</div>;
  }
}
