import { GearboxSDK, simulateWithPriceUpdates } from "@gearbox-protocol/sdk";
import { iVersionAbi } from "@gearbox-protocol/sdk/abi/iVersion";
import { useQueries } from "@tanstack/react-query";
import { Address, hexToString } from "viem";
import { usePublicClient } from "wagmi";

export function useGetPriceFeedsInfo({
  sdk,
  priceFeeds,
}: {
  sdk: GearboxSDK;
  priceFeeds: Address[];
}) {
  const publicClient = usePublicClient({ chainId: sdk.chainId });

  return useQueries({
    queries: priceFeeds.map((priceFeed) => ({
      queryKey: ["price-feed-info", sdk.chainId, priceFeed],
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
      enabled: !!publicClient,
      retry: 3,
    })),
  });
}
