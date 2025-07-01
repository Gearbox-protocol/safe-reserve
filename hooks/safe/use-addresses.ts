import { useQuery } from "@tanstack/react-query";
import { Address, isAddress } from "viem";
import { usePublicClient } from "wagmi";

function useAddress(args: {
  address?: Address;
  functionName: string;
  key: string;
}) {
  const { address, functionName, key } = args;
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: [key, address],
    queryFn: async () => {
      if (!publicClient || !address) return;

      if (!isAddress(address)) {
        throw new Error(`Invalid address: ${address}`);
      }

      return await publicClient.readContract({
        address,
        abi: [
          {
            type: "function",
            inputs: [],
            name: functionName,
            outputs: [{ name: "", internalType: "address", type: "address" }],
            stateMutability: "view",
          },
        ],
        functionName,
      });
    },
    enabled: !!publicClient && !!address,
    retry: 3,
  });
}

export function useTimelockAddress(marketConfigurator?: Address) {
  const { data, isLoading, error } = useAddress({
    key: "timelock-address",
    address: marketConfigurator,
    functionName: "admin",
  });

  return {
    timelock: data,
    isLoading,
    error: error as Error | null,
  };
}

export function useGovernorAddress(timelock?: Address) {
  const { data, isLoading, error } = useAddress({
    key: "governor-address",
    address: timelock,
    functionName: "admin",
  });

  return {
    governor: data,
    isLoading,
    error: error as Error | null,
  };
}

export function useSafeAddress(governor?: Address) {
  const { data, isLoading, error } = useAddress({
    key: "safe-address",
    address: governor,
    functionName: "owner",
  });

  return {
    safe: data,
    isLoading,
    error: error as Error | null,
  };
}

export function useGovernanceAddresses(marketConfigurator?: Address) {
  const {
    timelock,
    isLoading: isLoadingTimelock,
    error: errorTimelock,
  } = useTimelockAddress(marketConfigurator);

  const {
    governor,
    isLoading: isLoadingGovernor,
    error: errorGovernor,
  } = useGovernorAddress(timelock);

  const {
    safe,
    isLoading: isLoadingSafe,
    error: errorSafe,
  } = useSafeAddress(governor);

  return {
    safeAddress: safe,
    timelockAddress: timelock,
    governorAddress: governor,
    isLoading: isLoadingTimelock || isLoadingGovernor || isLoadingSafe,
    error: errorTimelock || errorGovernor || errorSafe,
  };
}
