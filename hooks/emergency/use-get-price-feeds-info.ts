import { GearboxSDK, simulateWithPriceUpdates } from "@gearbox-protocol/sdk";
import { iVersionAbi } from "@gearbox-protocol/sdk/abi";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { Address, hexToString } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export function useGetPriceFeedsInfo({
  sdk,
  priceFeeds,
}: {
  sdk: GearboxSDK;
  priceFeeds: Address[];
}) {
  const config = useConfig();

  const publicClient = useMemo(
    () => getPublicClient(config, { chainId: sdk.provider.chainId }),
    [config, sdk.provider.chainId]
  );
  return useQueries({
    queries: priceFeeds.map((priceFeed) => ({
      queryKey: ["price-feed-info", sdk.provider.chainId, priceFeed],
      queryFn: async () => {
        if (!publicClient) return;

        const updateTxs =
          await sdk.priceFeeds.generateExternalPriceFeedsUpdateTxs([priceFeed]);

        const price = await simulateWithPriceUpdates(publicClient, {
          priceUpdates: updateTxs.txs,
          contracts: [
            {
              address: priceFeed,
              abi: [
                {
                  inputs: [],
                  name: "latestRoundData",
                  outputs: [
                    { name: "roundId", type: "uint80" },
                    { name: "answer", type: "int256" },
                    { name: "startedAt", type: "uint256" },
                    { name: "updatedAt", type: "uint256" },
                    { name: "answeredInRound", type: "uint80" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
              ],
              functionName: "latestRoundData",
              args: [],
            },
          ],
        });

        try {
          const type = await publicClient.readContract({
            address: priceFeed,
            abi: iVersionAbi,
            functionName: "contractType",
          });

          const splittedType = hexToString(type, { size: 32 }).split("::");

          return { price, type: splittedType[splittedType.length - 1] };
        } catch {
          return { price, type: "EXTERNAL" };
        }
      },

      retry: 3,
    })),
  });
}
