import { GearboxSDK } from "@gearbox-protocol/sdk";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

export function useSDK() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["sdk"],
    queryFn: async () => {
      if (!publicClient) return null;

      return await GearboxSDK.attach({
        rpcURLs: [publicClient.transport.url!],
        marketConfigurators: [],
      });
    },
    enabled: !!publicClient,
  });
}
