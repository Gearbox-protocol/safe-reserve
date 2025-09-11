import { SafeTx } from "@gearbox-protocol/permissionless";
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

const RPC = process.env.RPC_URL;

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
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    console.log(`\nTransaction ${i + 1}/${txs.length}`);
    console.log("----------------------------------------");

    // Log transaction details
    console.log(`To: ${tx.to}`);
    if (tx.contractMethod) {
      console.log(`Method: ${tx.contractMethod.name}`);
      if (tx.contractInputsValues) {
        console.log("Input Values:");
        Object.entries(tx.contractInputsValues).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    }

    console.log(`Value: ${tx.value || 0} wei`);

    try {
      console.log("\nSending transaction...");
      const hash = await walletClient.sendTransaction({
        to: tx.to as Address,
        value: BigInt(tx.value || 0),
        data: tx.data as Address,
        gas: BigInt(29_000_000),
        chain: walletClient.chain!,
      });
      console.log(`Transaction hash: ${hash}`);

      console.log("Waiting for confirmation...");
      const receipt = await client.waitForTransactionReceipt({ hash });
      console.log(`Confirmed in block ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed}`);
      console.log(
        `Status: ${receipt.status === "success" ? "Success" : "Failed"}`
      );
    } catch (error) {
      console.error("Error executing transaction:", error);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
