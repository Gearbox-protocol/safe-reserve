import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useConfig, usePublicClient } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export function useSDK({
  chainId,
  configurators,
}: {
  chainId?: number;
  configurators?: Address[];
}) {
  const config = useConfig();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: [
      "sdk",
      chainId ?? publicClient?.chain.id,
      (configurators ?? [])
        .sort((a, b) => a.localeCompare(b))
        .map((c) => c.toLowerCase()),
    ],
    queryFn: async () => {
      const client = chainId
        ? getPublicClient(config, { chainId: chainId })
        : publicClient;
      if (!client) return null;

      return await GearboxSDK.attach({
        rpcURLs: [client.transport.url!],
        marketConfigurators: configurators ?? [],
      });
    },
    enabled: !!publicClient,
  });
}
