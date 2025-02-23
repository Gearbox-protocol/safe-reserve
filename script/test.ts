import { createPublicClient, http } from "viem";
import { safeStorageAbi } from "@/bindings/generated";
import { SAFE_STORAGE_ADDRESS } from "@/utils/constant";

async function main() {
  // Create public client
  const client = createPublicClient({
    transport: http(process.env.RPC_URL || "http://localhost:8545"),
  });

  // Example safe address - replace with actual address
  const safeAddress = "0xAF960f5F599E02Ff4A86cdA3640c5257D710e70a";

  try {
    const txs = await client.readContract({
      address: SAFE_STORAGE_ADDRESS,
      abi: safeStorageAbi,
      functionName: "getQueuedTxs",
      args: [safeAddress],
    });

    console.log("Queued transactions:", txs);
    return txs;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Failed to fetch current transactions: ${err.message}`);
    } else {
      console.error(
        "An unknown error occurred while fetching current transactions"
      );
    }
    process.exit(1);
  }
}

main();
