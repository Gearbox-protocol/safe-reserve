import {
  AddressProviderContract,
  MarketConfiguratorFactoryContract,
} from "@gearbox-protocol/permissionless";
import { useQueries } from "@tanstack/react-query";
import { isAddress } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { ADDRESS_PROVIDER, chains } from "../../config/wagmi";

export function useGetMarketConfigurators() {
  const config = useConfig();

  return useQueries({
    queries: chains.map((chain) => ({
      queryKey: ["marketConfigurators", chain.id],
      queryFn: async () => {
        if (!ADDRESS_PROVIDER || !isAddress(ADDRESS_PROVIDER)) {
          throw new Error("Invalid Address Provider");
        }

        const publicClient = getPublicClient(config, { chainId: chain.id });
        if (!publicClient) return;

        const addressProvider = new AddressProviderContract(
          ADDRESS_PROVIDER,
          publicClient
        );

        const mcFactoryAddress = await addressProvider.getAddressOrRevert(
          "MARKET_CONFIGURATOR_FACTORY"
        );

        const mcFactory = new MarketConfiguratorFactoryContract(
          mcFactoryAddress,
          publicClient
        );

        const configurators = await mcFactory.getMarketConfigurators();

        const curatorNames = (await publicClient.multicall({
          allowFailure: false,
          contracts: configurators.map((mc) => ({
            address: mc,
            abi: [
              {
                name: "curatorName",
                type: "function",
                stateMutability: "view",
                inputs: [],
                outputs: [{ name: "", type: "string" }],
              },
            ] as const,
            functionName: "curatorName",
          })),
        })) as string[];

        return configurators.map((mc, index) => ({
          name: curatorNames[index],
          marketConfigurator: mc,
          chain,
        }));
      },

      retry: 3,
    })),
  });
}
