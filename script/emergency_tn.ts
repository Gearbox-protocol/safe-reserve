import { sendTxs } from "@/utils/test/send-txs";
import { SafeTx } from "@gearbox-protocol/sdk/permissionless";
import { config } from "dotenv";
import { readFileSync } from "fs";
import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseEther,
  testActions,
} from "viem";

config({ path: ".env.local" });

const RPC = process.env.ANVIL_RPC_URL;

async function main() {
  // Get JSON file path from command line args
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Please provide path to JSON file");
    process.exit(1);
  }

  if (!RPC) {
    console.error("Please provide rpc url");
    process.exit(1);
  }

  // Read and parse JSON file
  const txs: Array<SafeTx> = JSON.parse(readFileSync(jsonPath, "utf-8"));

  if (txs.length === 0) {
    console.error("No transactions found");
    process.exit(1);
  }

  const client = createPublicClient({
    transport: http(RPC),
  }).extend(testActions({ mode: "anvil" }));

  const marketConfigurator = txs[0].to;

  console.log("Market configurator: ", marketConfigurator);

  const admin = await client.readContract({
    address: marketConfigurator as Address,
    abi: parseAbi(["function emergencyAdmin() view returns (address)"]),
    functionName: "emergencyAdmin",
  });

  await client.setCode({
    address: admin,
    bytecode: "0x",
  });

  await client.setBalance({
    address: admin,
    value: parseEther("10"),
  });

  await client.impersonateAccount({
    address: admin,
  });

  const chain = await client.getChainId();

  const walletClient = createWalletClient({
    account: admin,
    chain: {
      id: chain,
      name: "Anvil",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: { default: { http: [RPC] } },
    },
    transport: http(RPC),
  });

  // Execute transactions
  await sendTxs({
    publicClient: client,
    walletClient,
    txs,
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
