import { useQuery } from "@tanstack/react-query";
import { Address, isAddress } from "viem";
import { usePublicClient } from "wagmi";

function useAddress(args: {
  chainId?: number;
  address?: Address;
  functionName: string;
  key: string;
}) {
  const { chainId, address, functionName, key } = args;
  const publicClient = usePublicClient({ chainId });

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

export function useTimelockAddress(
  chainId?: number,
  marketConfigurator?: Address
) {
  const { data, isLoading, error } = useAddress({
    chainId,
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

export function useGovernorAddress(chainId?: number, timelock?: Address) {
  const { data, isLoading, error } = useAddress({
    chainId,
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

export function useSafeAddress(
  chainId?: number,
  governor?: Address,
  safeAddress?: Address
) {
  const {
    data: ownerAddress,
    isLoading,
    error,
  } = useAddress({
    chainId,
    key: "safe-address",
    address: governor,
    functionName: "owner",
  });

  return {
    safe: safeAddress ?? ownerAddress,
    isLoading: safeAddress ? false : isLoading,
    error: safeAddress ? null : (error as Error | null),
  };
}

export function useGovernanceAddresses(
  chainId?: number,
  marketConfigurator?: Address
) {
  const {
    timelock,
    isLoading: isLoadingTimelock,
    error: errorTimelock,
  } = useTimelockAddress(chainId, marketConfigurator);

  const {
    governor,
    isLoading: isLoadingGovernor,
    error: errorGovernor,
  } = useGovernorAddress(chainId, timelock);

  const {
    safe,
    isLoading: isLoadingSafe,
    error: errorSafe,
  } = useSafeAddress(chainId, governor);

  return {
    safeAddress: safe,
    timelockAddress: timelock,
    governorAddress: governor,
    isLoading: isLoadingTimelock || isLoadingGovernor || isLoadingSafe,
    error: errorTimelock || errorGovernor || errorSafe,
  };
}
