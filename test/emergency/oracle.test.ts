import { emergencyActionsMap } from "@/core/emergency-actions";
import { impersonateAndSendTxs } from "@/utils/test/send-txs";
import {
  Addresses,
  getPriceUpdateTx,
  MarketConfiguratorContract,
  PriceFeed,
  PriceFeedStoreContract,
} from "@gearbox-protocol/permissionless";
import { GearboxSDK, MarketSuite } from "@gearbox-protocol/sdk";
import { detectChain } from "@gearbox-protocol/sdk/dev";
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
  zeroAddress,
} from "viem";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

dotenvConfig({ path: ".env.local" });

const ANVIL_RPC = process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545";
const RPC = process.env.NEXT_PUBLIC_RPC_URL;
const AP = process.env.NEXT_PUBLIC_ADDRESS_PROVIDER;

describe("Emergency oracle actions", () => {
  let client: PublicClient & TestClient<"anvil">;
  let snapshotId: Quantity | undefined;
  let sdk: GearboxSDK;

  let randomMarket: MarketSuite;
  let mc: MarketConfiguratorContract;
  let admin: Address;

  let tokenFeedsMap: Record<`0x${string}`, PriceFeed[]>;

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

    const priceFeedStore = new PriceFeedStoreContract(
      Addresses.PRICE_FEED_STORE,
      client
    );

    const tokenToPriceFeeds = await priceFeedStore.getTokenPriceFeedsMap();

    const priceFeedsAddresses = Array.from(
      new Set(
        tokenToPriceFeeds
          .flatMap((token) => token.priceFeeds)
          .map((pf) => pf.toLowerCase() as Address)
      )
    );

    const priceFeeds =
      await priceFeedStore.getPriceFeedsInfo(priceFeedsAddresses);

    const priceFeedsInfo = priceFeeds.reduce<
      Record<Address, (typeof priceFeeds)[number]>
    >(
      (acc, pf) => {
        acc[pf.address.toLowerCase() as Address] = pf;
        return acc;
      },
      {} as Record<Address, (typeof priceFeeds)[number]>
    );

    tokenFeedsMap = tokenToPriceFeeds.reduce<
      Record<Address, (typeof priceFeeds)[number][]>
    >(
      (acc, item) => {
        const tokenAddress = item.token.toLowerCase() as Address;

        const feeds = item.priceFeeds
          .map((pf) => priceFeedsInfo[pf.toLowerCase() as Address])
          .filter((v) => v !== undefined);

        acc[tokenAddress] = feeds as (typeof priceFeeds)[number][];
        return acc;
      },
      {} as Record<Address, (typeof priceFeeds)[number][]>
    );
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
    if (snapshotId) {
      await client.revert({ id: snapshotId });
    }
  });

  it("sets main price feed for a token", async () => {
    const assets = randomMarket.pool.pqk.quotas
      .keys()
      .map((address) => ({
        address: address.toLowerCase() as Address,
        mainPriceFeed:
          randomMarket.priceOracle.mainPriceFeeds.get(address as Address)
            ?.address || zeroAddress,
      }))
      .map((asset) => ({
        ...asset,
        candidates: tokenFeedsMap[asset.address].filter(
          (feed) =>
            feed.address.toLowerCase() !== asset.mainPriceFeed.toLowerCase() &&
            feed.contractType !== "PRICE_FEED::ZERO"
        ),
      }))
      .filter((asset) => asset.candidates.length > 0);

    const randomToken = assets[Math.floor(Math.random() * assets.length)];
    console.log(
      `Picked random token: ${randomToken.address} [${sdk.tokensMeta.symbol(randomToken.address)}]`
    );

    const newFeed =
      randomToken.candidates[
        Math.floor(Math.random() * randomToken.candidates.length)
      ];

    console.log(
      `Picked random price feed: ${newFeed.address} [${newFeed.contractType.replace("PRICE_FEED::", "")}]`
    );

    const updateTx = await getPriceUpdateTx({
      client,
      priceFeeds: [newFeed.address],
      useMulticall3: true,
    });

    const action = await emergencyActionsMap["ORACLE::setPriceFeed"].getRawTx({
      mc,
      action: {
        type: "ORACLE::setPriceFeed",
        params: {
          pool: randomMarket.pool.pool.address,
          token: randomToken.address,
          priceFeed: newFeed.address,
        },
      },
    });

    await impersonateAndSendTxs({
      rpc: ANVIL_RPC,
      publicClient: client,
      account: admin,
      txs: (updateTx ? [updateTx] : []).concat([action.tx]),
    });

    const mainFeed = (await client.readContract({
      address: randomMarket.priceOracle.address,
      abi: parseAbi(["function priceFeeds(address) view returns (address)"]),
      functionName: "priceFeeds",
      args: [randomToken.address],
    })) as Address;

    expect(mainFeed.toLowerCase()).toBe(newFeed.address.toLowerCase());
  });
});
