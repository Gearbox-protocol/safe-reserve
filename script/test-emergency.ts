import { emergencyActionsMap } from "@/core/emergency-actions";
import { MarketConfiguratorContract } from "@gearbox-protocol/permissionless";
import { GearboxSDK, RawTx } from "@gearbox-protocol/sdk";
import { config } from "dotenv";
import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  parseAbi,
  parseEther,
  PublicClient,
  testActions,
} from "viem";

config({ path: ".env.local" });

const RPC = process.env.RPC_URL;
const AP = process.env.NEXT_PUBLIC_ADDRESS_PROVIDER;

async function executeTx({
  publicClient,
  marketConfigurator,
  tx,
}: {
  publicClient: PublicClient;
  marketConfigurator: Address;
  tx: RawTx;
}) {
  if (!RPC) {
    console.error("Please provide rpc url");
    process.exit(1);
  }

  const client = publicClient.extend(testActions({ mode: "anvil" }));

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
      account: admin,
      to: tx.to,
      value: BigInt(tx.value || 0),
      data: tx.callData,
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

async function main() {
  if (!RPC) {
    console.error("Please provide rpc url");
    process.exit(1);
  }

  if (!AP || !isAddress(AP)) {
    console.error("Please provide address provider address");
    process.exit(1);
  }

  const client = createPublicClient({
    transport: http(RPC),
  });

  const sdk = await GearboxSDK.attach({
    rpcURLs: [RPC],
    addressProvider: AP,
  });

  const markets = sdk.marketRegister.markets.filter(
    (m) => !m.pool.pool.isPaused && m.pool.pool.version >= 310
  );
  const randomMarket = markets[Math.floor(Math.random() * markets.length)];

  await executeTx({
    publicClient: client,
    marketConfigurator: randomMarket.configurator.address,
    tx: emergencyActionsMap["POOL::pause"].getRawTx({
      mc: new MarketConfiguratorContract(
        randomMarket.configurator.address,
        client
      ),
      action: {
        type: "POOL::pause",
        params: {
          pool: randomMarket.pool.pool.address,
        },
      },
    }).tx,
  });

  const cms = sdk.marketRegister.creditManagers.filter(
    (cm) => !cm.creditFacade.isPaused && cm.creditManager.version >= 310
  );
  const randomCm = cms[Math.floor(Math.random() * cms.length)];
  await executeTx({
    publicClient: client,
    marketConfigurator: randomCm.marketConfigurator,
    tx: emergencyActionsMap["CREDIT::pause"].getRawTx({
      mc: new MarketConfiguratorContract(randomCm.marketConfigurator, client),
      action: {
        type: "CREDIT::pause",
        params: {
          creditManager: randomCm.creditManager.address,
        },
      },
    }).tx,
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
