import { MarketConfiguratorContract } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address, zeroAddress } from "viem";
import { usePublicClient } from "wagmi";

export function useGetMultipause({
  chainId,
  marketConfigurator,
}: {
  chainId: number;
  marketConfigurator: Address;
}) {
  const publicClient = usePublicClient({ chainId });

  return useQuery({
    queryKey: ["multipause", chainId, marketConfigurator.toLowerCase()],
    queryFn: async () => {
      if (!publicClient) return;
      const mc = new MarketConfiguratorContract(
        marketConfigurator,
        publicClient
      );

      const pause = await mc.multipause();
      return pause ?? zeroAddress;
    },
    enabled: !!publicClient,
    retry: 3,
  });
}
