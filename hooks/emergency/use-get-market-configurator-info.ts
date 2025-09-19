import { iMarketConfiguratorAbi } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

export function useGetMarketConfiguratorInfo({
  chainId,
  address,
}: {
  chainId: number;
  address: Address;
}) {
  const publicClient = usePublicClient({ chainId });

  return useQuery({
    queryKey: ["marketConfigurator", chainId, address.toLowerCase()],
    queryFn: async () => {
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
    enabled: !!publicClient,
    retry: 3,
  });
}
