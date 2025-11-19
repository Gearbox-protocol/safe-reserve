import { SDK_GAS_LIMIT_BY_CHAIN } from "@/config/wagmi";
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

  chainId = chainId ?? publicClient?.chain.id;

  return useQuery({
    queryKey: [
      "sdk",
      chainId,
      (configurators ?? [])
        .sort((a, b) => a.localeCompare(b))
        .map((c) => c.toLowerCase()),
    ],
    queryFn: async () => {
      if (!publicClient) return null;

      return await GearboxSDK.attach({
        rpcURLs: [publicClient.transport.url!],
        marketConfigurators: configurators ?? [],
        redstone: {
          ignoreMissingFeeds: true,
        },
        pyth: {
          ignoreMissingFeeds: true,
        },
        gasLimit: SDK_GAS_LIMIT_BY_CHAIN[chainId!],
      });
    },
    enabled: !!publicClient,
  });
}
