import { useMemo } from "react";
import { Address } from "viem";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import {
  EmergencyActions,
  emergencyActionsMap,
} from "../../core/emergency-actions";
import { MarketConfiguratorContract } from "@gearbox-protocol/permissionless";

export function useGetEmergencyTx({
  chainId,
  marketConfigurator,
  action,
}: {
  chainId: number;
  marketConfigurator: Address;
  action: EmergencyActions;
}) {
  const config = useConfig();

  return useMemo(() => {
    const publicClient = getPublicClient(config, { chainId });
    if (!publicClient) return;

    const mc = new MarketConfiguratorContract(marketConfigurator, publicClient);
    const actionMeta = emergencyActionsMap[action.type];
    return actionMeta?.getRawTx({
      mc,
      action,
    });
  }, [config, chainId, marketConfigurator, action]);
}
