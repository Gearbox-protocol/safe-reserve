import { AccessMode, emergencyActionsMap } from "@/core/emergency-actions";
import { getLossPolicyState } from "@/utils/state";
import { impersonateAndSendTxs } from "@/utils/test/send-txs";
import { GearboxSDK, MarketSuite } from "@gearbox-protocol/sdk";
import { detectChain } from "@gearbox-protocol/sdk/dev";
import { MarketConfiguratorContract } from "@gearbox-protocol/sdk/permissionless";
import { config as dotenvConfig } from "dotenv";
import {
  Address,
  createPublicClient,
  http,
  isAddress,
  parseAbi,
  PublicClient,
  Quantity,
  testActions,
  TestClient,
} from "viem";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

dotenvConfig({ path: ".env.local" });

const ANVIL_RPC = process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545";
const RPC = process.env.NEXT_PUBLIC_RPC_URL;
const AP = process.env.NEXT_PUBLIC_ADDRESS_PROVIDER;

describe("Emergency loss policy actions", () => {
  let client: PublicClient & TestClient<"anvil">;
  let snapshotId: Quantity | undefined;
  let sdk: GearboxSDK;

  let randomMarket: MarketSuite;
  let mc: MarketConfiguratorContract;
  let admin: Address;

  let lossPolicy: {
    address: Address;
    accessMode: AccessMode;
    checksEnabled: boolean;
  };

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
      cacheTime: 0,
      pollingInterval: 50,
    }).extend(testActions({ mode: "anvil" })) as unknown as PublicClient &
      TestClient<"anvil">;
    snapshotId = await client.snapshot();

    sdk = await GearboxSDK.attach({
      rpcURLs: [RPC],
      addressProvider: AP,
      redstone: {
        ignoreMissingFeeds: true,
      },
      pyth: {
        ignoreMissingFeeds: true,
      },
    });
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

    const state = getLossPolicyState(randomMarket.state.lossPolicy.baseParams);
    expect(["LOSS_POLICY::ALIASED"]).toContain(state.type);
    console.log(
      `Loss Policy: ${state.lossPolicy} [${state.type.replace("LOSS_POLICY::", "")}]`
    );
    lossPolicy = {
      address: state.lossPolicy,
      accessMode: state.state!.accessMode,
      checksEnabled: state.state!.checksEnabled,
    };
  });

  afterEach(async () => {
    console.groupEnd();
    console.log("\n\n\n");
    if (snapshotId) {
      await client.revert({ id: snapshotId });
    }
  });

  it("set loss policy access mode", async () => {
    const availableModes = (
      Object.values(AccessMode).filter(
        (value) => typeof value === "number"
      ) as AccessMode[]
    ).filter((mode) => mode !== lossPolicy.accessMode);
    const randomeMode =
      availableModes[Math.floor(Math.random() * availableModes.length)];

    const action = await emergencyActionsMap[
      "LOSS_POLICY::setAccessMode"
    ].getRawTx({
      mc,
      action: {
        type: "LOSS_POLICY::setAccessMode",
        params: {
          pool: randomMarket.pool.pool.address,
          mode: randomeMode as AccessMode,
        },
      },
    });

    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [action.tx],
    });

    const modeAfter = Number(
      await client.readContract({
        address: lossPolicy.address,
        abi: parseAbi(["function accessMode() view returns (uint8)"]),
        functionName: "accessMode",
      })
    );

    expect(modeAfter).toBe(randomeMode);
  });

  it("toggles loss policy checksEnabled", async () => {
    const action = await emergencyActionsMap[
      "LOSS_POLICY::setChecksEnabled"
    ].getRawTx({
      mc,
      action: {
        type: "LOSS_POLICY::setChecksEnabled",
        params: {
          pool: randomMarket.pool.pool.address,
          enabled: !lossPolicy.checksEnabled,
        },
      },
    });

    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [action.tx],
    });

    const after = (await client.readContract({
      address: lossPolicy.address,
      abi: parseAbi(["function checksEnabled() view returns (bool)"]),
      functionName: "checksEnabled",
    })) as boolean;

    expect(after).toBe(!lossPolicy.checksEnabled);
  });
});
