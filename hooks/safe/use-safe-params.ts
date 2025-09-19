import { safeAbi } from "@/abi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

export function useSafeParams(chainId?: number, safeAddress?: Address) {
  const publicClient = usePublicClient({ chainId });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["safe-params"],
    queryFn: async () => {
      if (!safeAddress || !publicClient) return;

      const [safeThreshold, safeSigners, safeNonce] = await Promise.all([
        publicClient.readContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "getThreshold",
        }),
        publicClient.readContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "getOwners",
        }),
        publicClient.readContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "nonce",
        }),
      ]);

      return {
        threshold: Number(safeThreshold),
        signers: [...safeSigners],
        nonce: safeNonce,
      };
    },
    enabled: !!safeAddress && !!publicClient,
    retry: 3,
  });

  return {
    threshold: data?.threshold,
    signers: data?.signers,
    nonce: data?.nonce,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
