import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { governorAbi } from "../bindings/generated";

export function useTimelock(governor?: Address) {
  const publicClient = usePublicClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["timelock-address", governor],
    queryFn: async () => {
      if (!publicClient || !governor) return;

      return await publicClient.readContract({
        address: governor,
        abi: governorAbi,
        functionName: "timeLock",
      });
    },
    enabled: !!publicClient && !!governor,
    retry: 3,
  });

  return {
    timelock: data,
    isLoading,
    error: error as Error | null,
  };
}
