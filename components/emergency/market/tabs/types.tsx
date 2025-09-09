import { GearboxSDK, MarketSuite } from "@gearbox-protocol/sdk";
import { Address } from "viem";

export interface MarketProps {
  chainId: number;
  marketConfigurator: Address;
  market: MarketSuite;
  sdk: GearboxSDK;
}

export interface MarketAsset {
  address: Address;
  symbol: string;
  quotaLimit: number;
  mainPriceFeed: Address;
  reservePriceFeed: Address;
}
