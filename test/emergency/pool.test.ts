import { emergencyActionsMap } from "@/core/emergency-actions";
import { impersonateAndSendTxs } from "@/utils/test/send-txs";
import { MarketConfiguratorContract } from "@gearbox-protocol/permissionless";
import { GearboxSDK, MarketSuite } from "@gearbox-protocol/sdk";
import {
  iPoolQuotaKeeperV310Abi,
  iPoolV310Abi,
} from "@gearbox-protocol/sdk/abi";
import { detectChain } from "@gearbox-protocol/sdk/dev";
import { config as dotenvConfig } from "dotenv";
import {
  Address,
  createPublicClient,
  formatUnits,
  http,
  isAddress,
  parseAbi,
  PublicClient,
} from "viem";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

dotenvConfig({ path: ".env.local" });

const ANVIL_RPC = process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545";
const RPC = process.env.NEXT_PUBLIC_RPC_URL;
const AP = process.env.NEXT_PUBLIC_ADDRESS_PROVIDER;

describe("Emergency pool actions", () => {
  let client: PublicClient;
  let sdk: GearboxSDK;

  let randomMarket: MarketSuite;
  let mc: MarketConfiguratorContract;
  let admin: Address;

  beforeAll(async () => {
    if (!RPC) throw new Error("Please provide rpc url");
    if (!AP || !isAddress(AP))
      throw new Error("Please provide address provider address");

    const chain = await detectChain(RPC);
    client = createPublicClient({
      chain,
      transport: http(ANVIL_RPC, {
        timeout: 300_000,
      }),
    });
    sdk = await GearboxSDK.attach({ rpcURLs: [RPC], addressProvider: AP });
  });

  beforeEach(async () => {
    const markets = sdk.marketRegister.markets.filter(
      (m) => !m.pool.pool.isPaused && m.pool.pool.version >= 310
    );
    expect(markets.length).toBeGreaterThan(0);

    randomMarket = markets[Math.floor(Math.random() * markets.length)];
    mc = new MarketConfiguratorContract(
      randomMarket.configurator.address,
      client
    );

    admin = await client.readContract({
      address: randomMarket.configurator.address,
      abi: parseAbi(["function emergencyAdmin() view returns (address)"]),
      functionName: "emergencyAdmin",
    });

    console.group("==================================");
    console.log(`Picked random market: ${randomMarket.pool.pool.address}`);
    console.log(`Configurator: ${mc.address}`);
    console.log(`Emergency Admin: ${admin}`);
  });

  afterEach(async () => {
    console.groupEnd();
    console.log("\n\n\n");
  });

  it("pauses a random pool", async () => {
    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["POOL::pause"].getRawTx({
          mc,
          action: {
            type: "POOL::pause",
            params: {
              pool: randomMarket.pool.pool.address,
            },
          },
        }).tx,
      ],
    });

    // Verify paused state
    const poolPaused = await client.readContract({
      address: randomMarket.pool.pool.address as Address,
      abi: parseAbi(["function paused() view returns (bool)"]),
      functionName: "paused",
    });
    expect(poolPaused).toBe(true);
  });

  it("sets credit manager debt limit to zero for a random market", async () => {
    const creditManagers = randomMarket.creditManagers.filter((cm) => {
      const limit = randomMarket.pool.pool.creditManagerDebtParams.get(
        cm.creditManager.address
      )?.limit;

      return (limit ?? 0n) > 0n;
    });

    const randomCm =
      creditManagers[Math.floor(Math.random() * creditManagers.length)];

    console.log(`Picked random cm: ${randomCm.creditManager.address}`);

    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["POOL::setCreditManagerDebtLimitToZero"].getRawTx({
          mc,
          action: {
            type: "POOL::setCreditManagerDebtLimitToZero",
            params: {
              pool: randomMarket.pool.pool.address,
              creditManager: randomCm.creditManager.address,
            },
          },
        }).tx,
      ],
    });

    // Verify via pool storage mapping read
    const limit = await client.readContract({
      address: randomMarket.pool.pool.address as Address,
      abi: iPoolV310Abi,
      functionName: "creditManagerDebtLimit",
      args: [randomCm.creditManager.address as Address],
    });

    expect(limit).toBe(0n);
  });

  it("sets token limit to zero for a random market token", async () => {
    const underlying = sdk.tokensMeta.mustGet(
      randomMarket.pool.pool.underlying
    );

    const quotaTokens = Array.from(
      randomMarket.pool.pqk.quotas.values()
    ).filter((token) => token.limit > 0n);

    const randomToken =
      quotaTokens[Math.floor(Math.random() * quotaTokens.length)];

    console.log(
      `Picked random token: ${randomToken.token} [${sdk.tokensMeta.symbol(randomToken.token)}] with limit ${formatUnits(randomToken.limit, underlying.decimals)} ${underlying.symbol}`
    );

    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["POOL::setTokenLimitToZero"].getRawTx({
          mc,
          action: {
            type: "POOL::setTokenLimitToZero",
            params: {
              pool: randomMarket.pool.pool.address,
              token: randomToken.token,
            },
          },
        }).tx,
      ],
    });

    // Verify token limit is zero via pool token params
    const params = await client.readContract({
      address: randomMarket.pool.pqk.address as Address,
      abi: iPoolQuotaKeeperV310Abi,
      functionName: "getTokenQuotaParams",
      args: [randomToken.token],
    });

    expect(params[4]).toBe(0n);
  });
});
