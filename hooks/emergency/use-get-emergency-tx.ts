import {
  EmergencyActions,
  emergencyActionsMap,
} from "@/core/emergency-actions";
import { MarketConfiguratorContract } from "@gearbox-protocol/permissionless";
import { useMemo } from "react";
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

  return useMemo(() => {
    if (!publicClient) return;

    const mc = new MarketConfiguratorContract(marketConfigurator, publicClient);
    const actionMeta = emergencyActionsMap[action.type];
    return actionMeta?.getRawTx({
      mc,
      action,
    });
  }, [publicClient, marketConfigurator, action]);
}
