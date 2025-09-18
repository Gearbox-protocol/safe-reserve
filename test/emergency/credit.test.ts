import { emergencyActionsMap } from "@/core/emergency-actions";
import { impersonateAndSendTxs } from "@/utils/test/send-txs";
import { MarketConfiguratorContract } from "@gearbox-protocol/permissionless";
import { CreditSuite, GearboxSDK } from "@gearbox-protocol/sdk";
import {
  iCreditConfiguratorV310Abi,
  iCreditFacadeV310Abi,
  iCreditManagerV310Abi,
  iMarketConfiguratorV310Abi,
} from "@gearbox-protocol/sdk/abi";
import { detectChain } from "@gearbox-protocol/sdk/dev";
import { config as dotenvConfig } from "dotenv";
import {
  Address,
  createPublicClient,
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

describe("Emergency credit actions", () => {
  let client: PublicClient;
  let sdk: GearboxSDK;

  let randomCm: CreditSuite;
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
    const cms = sdk.marketRegister.creditManagers.filter(
      (cm) =>
        !cm.creditFacade.isPaused &&
        cm.creditFacade.maxDebtPerBlockMultiplier > 0n &&
        cm.creditManager.version >= 310
    );
    expect(cms.length).toBeGreaterThan(0);
    randomCm = cms[Math.floor(Math.random() * cms.length)];

    mc = new MarketConfiguratorContract(randomCm.marketConfigurator, client);

    admin = await client.readContract({
      address: randomCm.marketConfigurator,
      abi: iMarketConfiguratorV310Abi,
      functionName: "emergencyAdmin",
    });

    console.group("==================================");
    console.log(
      `Picked random credit manager: ${randomCm.creditManager.address}`
    );
    console.log(`Configurator: ${mc.address}`);
    console.log(`Emergency Admin: ${admin}`);
  });

  afterEach(async () => {
    console.groupEnd();
    console.log("\n\n\n");
  });

  it("pause a random credit manager", async () => {
    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["CREDIT::pause"].getRawTx({
          mc,
          action: {
            type: "CREDIT::pause",
            params: {
              creditManager: randomCm.creditManager.address,
            },
          },
        }).tx,
      ],
    });

    // Verify paused state on CreditFacade
    const isPaused = await client.readContract({
      address: randomCm.creditFacade.address as Address,
      abi: parseAbi(["function paused() view returns (bool)"]),
      functionName: "paused",
    });
    expect(isPaused).toBe(true);
  });

  it("forbid borrowing in a random credit manager", async () => {
    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["CREDIT::forbidBorrowing"].getRawTx({
          mc,
          action: {
            type: "CREDIT::forbidBorrowing",
            params: {
              creditManager: randomCm.creditManager.address,
            },
          },
        }).tx,
      ],
    });

    // Verify borrowing is forbidden on CreditFacade
    const maxDebtPerBlockMultiplier = await client.readContract({
      address: randomCm.creditFacade.address as Address,
      abi: iCreditFacadeV310Abi,
      functionName: "maxDebtPerBlockMultiplier",
    });

    expect(maxDebtPerBlockMultiplier).toBe(0);
  });

  it("forbid an adapter in a random credit manager", async () => {
    const randomAdapter =
      randomCm.creditManager.adapters.values()[
        Math.floor(
          Math.random() * randomCm.creditManager.adapters.values().length
        )
      ];

    console.log(
      `Picked random adapter: ${randomAdapter.address} [${randomAdapter.contractType.replace("ADAPTER::", "")}] with target ${randomAdapter.targetContract}`
    );

    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["CREDIT::forbidAdapter"].getRawTx({
          mc,
          action: {
            type: "CREDIT::forbidAdapter",
            params: {
              creditManager: randomCm.creditManager.address,
              adapter: randomAdapter.address,
            },
          },
        }).tx,
      ],
    });

    // Verify adapter is forbidden on CreditFacade (bool mapping)
    const adapters = (
      await client.readContract({
        address: randomCm.creditConfigurator.address as Address,
        abi: iCreditConfiguratorV310Abi,
        functionName: "allowedAdapters",
        args: [],
      })
    ).map((a) => a.toLowerCase() as Address);

    expect(
      adapters.includes(randomAdapter.address.toLowerCase() as Address)
    ).toBe(false);
  });

  it("forbid a collateral token in a random credit manager", async () => {
    // pick a token that is not yet forbidden
    const forbiddenMaskBefore = await client.readContract({
      address: randomCm.creditFacade.address,
      abi: iCreditFacadeV310Abi,
      functionName: "forbiddenTokenMask",
    });

    const bits = await client.multicall({
      allowFailure: false,
      contracts: randomCm.creditManager.collateralTokens.map((token) => ({
        address: randomCm.creditManager.address,
        abi: iCreditManagerV310Abi,
        functionName: "getTokenMaskOrRevert" as const,
        args: [token] as const,
      })),
    });

    const collaterals = randomCm.creditManager.collateralTokens
      .map((token, index) => ({
        address: token,
        mask: bits[index],
      }))
      .filter(
        ({ address, mask }) =>
          (forbiddenMaskBefore & mask) === 0n &&
          address.toLowerCase() !== randomCm.underlying.toLowerCase()
      );

    const randomToken =
      collaterals[Math.floor(Math.random() * collaterals.length)];

    console.log(
      `Picked random token: ${randomToken.address} [${sdk.tokensMeta.symbol(randomToken.address)}]`
    );

    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: [
        emergencyActionsMap["CREDIT::forbidToken"].getRawTx({
          mc,
          action: {
            type: "CREDIT::forbidToken",
            params: {
              creditManager: randomCm.creditManager.address,
              token: randomToken.address,
            },
          },
        }).tx,
      ],
    });

    const forbiddenMaskAfter = await client.readContract({
      address: randomCm.creditFacade.address,
      abi: iCreditFacadeV310Abi,
      functionName: "forbiddenTokenMask",
    });

    expect((forbiddenMaskAfter & randomToken.mask) !== 0n).toBe(true);
  });
});
