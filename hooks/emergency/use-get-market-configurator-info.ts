import { iMarketConfiguratorAbi } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export function useGetMarketConfiguratorInfo({
  chainId,
  address,
}: {
  chainId: number;
  address: Address;
}) {
  const config = useConfig();

  return useQuery({
    queryKey: ["marketConfigurator", chainId, address.toLowerCase()],
    queryFn: async () => {
      const publicClient = getPublicClient(config, { chainId });
      if (!publicClient) return;

      const [curatorName, emergencyAdmin] = (await publicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address,
            abi: iMarketConfiguratorAbi,
            functionName: "curatorName",
          },
          {
            address,
            abi: iMarketConfiguratorAbi,
            functionName: "emergencyAdmin",
          },
        ],
      })) as string[];

      return {
        curatorName,
        emergencyAdmin,
      };
    },
    retry: 3,
  });
}
