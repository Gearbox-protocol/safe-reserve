import { safeAbi } from "@/abi";
import { EmergencyActionsType } from "@/core/emergency-actions";
import {
  iMarketConfiguratorAbi,
  MarketConfiguratorContract,
} from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address, PublicClient, zeroAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";

export type AdminInfo =
  | { type: "eoa"; admin: Address }
  | {
      type: "safe";
      admin: Address;
      info: { threshold: number; signers: Address[]; nonce: number };
    }
  | { type: "unknown"; admin: Address };

const checkAdminType = async ({
  client,
  admin,
}: {
  client: PublicClient;
  admin: Address;
}) => {
  const code = await client.getCode({
    address: admin,
  });

  if (!code) {
    return {
      type: "eoa" as const,
      admin,
    };
  }

  try {
    const [safeThreshold, safeSigners, safeNonce] = await client.multicall({
      allowFailure: false,
      contracts: [
        {
          address: admin,
          abi: safeAbi,
          functionName: "getThreshold",
        },
        {
          address: admin,
          abi: safeAbi,
          functionName: "getOwners",
        },
        {
          address: admin,
          abi: safeAbi,
          functionName: "nonce",
        },
      ],
    });

    return {
      type: "safe" as const,
      admin,
      info: {
        threshold: Number(safeThreshold),
        signers: [...safeSigners],
        nonce: Number(safeNonce),
      },
    };
  } catch {
    return {
      type: "unknown" as const,
      admin,
    };
  }
};

export function useGetEmergencyAdminInfo({
  chainId,
  marketConfigurator,
  actionType,
}: {
  chainId: number;
  marketConfigurator: Address;
  actionType: EmergencyActionsType;
}) {
  const publicClient = usePublicClient({ chainId });
  const { address } = useAccount();

  return useQuery<AdminInfo | undefined, Error>({
    queryKey: [
      "emergency-admin-info",
      chainId,
      marketConfigurator.toLowerCase(),
    ],
    queryFn: async () => {
      if (!publicClient) return;

      if (actionType.startsWith("MULTI_PAUSE::")) {
        const mc = new MarketConfiguratorContract(
          marketConfigurator,
          publicClient
        );

        const { pausableAdmins } = await mc.admins();

        // check connected wallet first
        if (
          address &&
          pausableAdmins
            .map((a) => a.toLowerCase())
            .includes(address?.toLowerCase())
        ) {
          return await checkAdminType({
            client: publicClient,
            admin: address,
          });
        }

        // try to find safe admin
        const adminTypes = await Promise.all(
          pausableAdmins.map((admin) =>
            checkAdminType({
              client: publicClient,
              admin,
            })
          )
        );

        const safe = adminTypes.find((admin) => admin.type === "safe");

        return (
          safe ?? {
            type: "unknown" as const,
            admin: zeroAddress,
          }
        );
      }

      const emergencyAdmin = await publicClient.readContract({
        address: marketConfigurator,
        abi: iMarketConfiguratorAbi,
        functionName: "emergencyAdmin",
      });

      return await checkAdminType({
        client: publicClient,
        admin: emergencyAdmin,
      });
    },
    enabled: !!publicClient,
    retry: 3,
  });
}
