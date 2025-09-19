import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

export function useSDK({
  chainId,
  configurators,
}: {
  chainId?: number;
  configurators?: Address[];
}) {
  const publicClient = usePublicClient({
    chainId,
  });

  return useQuery({
    queryKey: [
      "sdk",
      chainId ?? publicClient?.chain.id,
      (configurators ?? [])
        .sort((a, b) => a.localeCompare(b))
        .map((c) => c.toLowerCase()),
    ],
    queryFn: async () => {
      if (!publicClient) return null;

      return await GearboxSDK.attach({
        rpcURLs: [publicClient.transport.url!],
        marketConfigurators: configurators ?? [],
      });
    },
    enabled: !!publicClient,
  });
}
