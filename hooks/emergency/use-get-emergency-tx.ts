import {
  EmergencyActions,
  emergencyActionsMap,
} from "@/core/emergency-actions";
import { MarketConfiguratorContract } from "@gearbox-protocol/sdk/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { usePublicClient } from "wagmi";

export function useGetEmergencyTx({
  chainId,
  marketConfigurator,
  action,
}: {
  chainId: number;
  marketConfigurator: Address;
  action: EmergencyActions;
}) {
  const publicClient = usePublicClient({ chainId });

  return useQuery({
    queryKey: [
      "emergency-raw-tx",
      chainId,
      marketConfigurator.toLowerCase(),
      action,
    ],
    queryFn: async () => {
      if (!publicClient) return;
      const mc = new MarketConfiguratorContract(
        marketConfigurator,
        publicClient
      );
      const actionMeta = emergencyActionsMap[action.type];
      return await actionMeta?.getRawTx({
        mc,
        action,
      });
    },
    enabled: !!publicClient,
    retry: 3,
  });
}
