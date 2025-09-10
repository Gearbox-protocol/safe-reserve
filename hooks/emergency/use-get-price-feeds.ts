import {
  Addresses,
  PriceFeedStoreContract,
} from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export function useGetPriceFeeds({ chainId }: { chainId: number }) {
  const config = useConfig();

  return useQuery({
    queryKey: ["price-feeds", chainId],
    queryFn: async () => {
      const publicClient = getPublicClient(config, { chainId });
      if (!publicClient) return;

      const priceFeedStore = new PriceFeedStoreContract(
        Addresses.PRICE_FEED_STORE,
        publicClient
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

      const tokenMap = tokenToPriceFeeds.reduce<
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

      return { priceFeedsInfo, tokenMap };
    },
    retry: 3,
  });
}
