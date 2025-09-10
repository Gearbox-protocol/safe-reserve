import { safeAbi } from "@/abi";
import { iMarketConfiguratorAbi } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export type EmergencyAdminInfo =
  | { type: "eoa"; emergencyAdmin: Address }
  | {
      type: "safe";
      emergencyAdmin: Address;
      info: { threshold: number; signers: Address[]; nonce: number };
    }
  | { type: "unknown"; emergencyAdmin: Address };

export function useGetEmergencyAdminInfo({
  chainId,
  marketConfigurator,
}: {
  chainId: number;
  marketConfigurator: Address;
}) {
  const config = useConfig();

  return useQuery<EmergencyAdminInfo | undefined, Error>({
    queryKey: [
      "emergency-admin-info",
      chainId,
      marketConfigurator.toLowerCase(),
    ],
    queryFn: async () => {
      const publicClient = getPublicClient(config, { chainId });
      if (!publicClient) return;

      const emergencyAdmin = await publicClient.readContract({
        address: marketConfigurator,
        abi: iMarketConfiguratorAbi,
        functionName: "emergencyAdmin",
      });

      const code = await publicClient.getCode({
        address: emergencyAdmin,
      });

      if (!code) {
        return {
          type: "eoa" as const,
          emergencyAdmin,
        };
      }

      try {
        const [safeThreshold, safeSigners, safeNonce] =
          await publicClient.multicall({
            allowFailure: false,
            contracts: [
              {
                address: emergencyAdmin,
                abi: safeAbi,
                functionName: "getThreshold",
              },
              {
                address: emergencyAdmin,
                abi: safeAbi,
                functionName: "getOwners",
              },
              {
                address: emergencyAdmin,
                abi: safeAbi,
                functionName: "nonce",
              },
            ],
          });

        return {
          type: "safe" as const,
          emergencyAdmin,
          info: {
            threshold: Number(safeThreshold),
            signers: [...safeSigners],
            nonce: Number(safeNonce),
          },
        };
      } catch {
        return {
          type: "unknown" as const,
          emergencyAdmin,
        };
      }
    },
    retry: 3,
  });
}
