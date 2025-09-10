import { GearboxSDK, MarketSuite } from "@gearbox-protocol/sdk";
import { Address } from "viem";

export interface MarketProps {
  chainId: number;
  marketConfigurator: Address;
  market: MarketSuite;
  sdk: GearboxSDK;
}

export interface CollateralToken {
  address: Address;
  symbol: string;
}

export interface MarketAsset extends CollateralToken {
  quotaLimit: number;
  mainPriceFeed: Address;
  reservePriceFeed: Address;
}
