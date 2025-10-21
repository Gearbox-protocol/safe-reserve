import { iMarketConfiguratorV310Abi } from "@gearbox-protocol/sdk/abi/310/generated";
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
            abi: iMarketConfiguratorV310Abi,
            functionName: "curatorName",
          },
          {
            address,
            abi: iMarketConfiguratorV310Abi,
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
