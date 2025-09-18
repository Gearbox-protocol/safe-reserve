import { AccessMode, emergencyActionsMap } from "@/core/emergency-actions";
import { impersonateAndSendTxs } from "@/utils/test/send-txs";
import { MarketConfiguratorContract } from "@gearbox-protocol/permissionless";
import { GearboxSDK, MarketSuite } from "@gearbox-protocol/sdk";
import { detectChain } from "@gearbox-protocol/sdk/dev";
import { config as dotenvConfig } from "dotenv";
import {
  Address,
  createPublicClient,
  decodeAbiParameters,
  hexToString,
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

describe("Emergency loss policy actions", () => {
  let client: PublicClient;
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

    const address = randomMarket.state.lossPolicy.baseParams.addr;
    const type = hexToString(
      randomMarket.state.lossPolicy.baseParams.contractType,
      { size: 32 }
    );

    expect(["LOSS_POLICY::ALIASED"]).toContain(type);
    console.log(
      `Loss Policy: ${address} [${type.replace("LOSS_POLICY::", "")}]`
    );

    switch (type) {
      case "LOSS_POLICY::ALIASED": {
        const decoded = decodeAbiParameters(
          [
            { name: "accessMode", type: "uint8" },
            { name: "checksEnabled", type: "bool" },
            { name: "tokens", type: "address[]" },
            {
              name: "priceFeedParams",
              type: "tuple[]",
              components: [
                { name: "priceFeed", type: "address" },
                { name: "stalenessPeriod", type: "uint32" },
                { name: "skipCheck", type: "bool" },
                { name: "tokenDecimals", type: "uint8" },
              ],
            },
          ],
          randomMarket.state.lossPolicy.baseParams.serializedParams
        );

        const [accessModeRaw, checksEnabled] = decoded;

        lossPolicy = {
          address,
          accessMode: Number(accessModeRaw) as AccessMode,
          checksEnabled,
        };
      }
    }
  });

  afterEach(async () => {
    console.groupEnd();
    console.log("\n\n\n");
  });

  it("set loss policy access mode", async () => {
    const availableModes = (
      Object.values(AccessMode).filter(
        (value) => typeof value === "number"
      ) as AccessMode[]
    ).filter((mode) => mode !== lossPolicy.accessMode);
    const randomeMode =
      availableModes[Math.floor(Math.random() * availableModes.length)];

    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["LOSS_POLICY::setAccessMode"].getRawTx({
          mc,
          action: {
            type: "LOSS_POLICY::setAccessMode",
            params: {
              pool: randomMarket.pool.pool.address,
              mode: randomeMode as AccessMode,
            },
          },
        }).tx,
      ],
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
    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["LOSS_POLICY::setChecksEnabled"].getRawTx({
          mc,
          action: {
            type: "LOSS_POLICY::setChecksEnabled",
            params: {
              pool: randomMarket.pool.pool.address,
              enabled: !lossPolicy.checksEnabled,
            },
          },
        }).tx,
      ],
    });

    const after = (await client.readContract({
      address: lossPolicy.address,
      abi: parseAbi(["function checksEnabled() view returns (bool)"]),
      functionName: "checksEnabled",
    })) as boolean;

    expect(after).toBe(!lossPolicy.checksEnabled);
  });
});
