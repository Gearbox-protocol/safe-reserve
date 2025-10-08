"use client";

import { chains } from "@/config/wagmi";
import { EmergencyActions } from "@/core/emergency-actions";
import {
  useGetEmergencyAdminInfo,
  useGetEmergencyTx,
  useGetMarketConfiguratorInfo,
  useSDK,
} from "@/hooks";
import { shortenHash } from "@gearbox-protocol/permissionless";
import {
  CopyButton,
  ExternalButton,
  PageLayout,
} from "@gearbox-protocol/permissionless-ui";
import { useMemo } from "react";
import { Address } from "viem";
import { EmergencyEoaTx } from "./tx-params/eoa/emergency-eoa-tx";
import { EmergencySafeTx } from "./tx-params/safe/emergency-safe-tx";

export function EmergencyActionView({
  chainId,
  marketConfigurator,
  action,
}: {
  chainId: number;
  marketConfigurator: Address;
  action: EmergencyActions;
}) {
  const chain = chains.find(({ id }) => id === chainId);

  const {
    data: mcInfo,
    isLoading: isLoadingMcInfo,
    error: mcInfoError,
  } = useGetMarketConfiguratorInfo({
    chainId,
    address: marketConfigurator,
  });

  const {
    data: adminInfo,
    isLoading: isLoadingAdminInfo,
    error: adminInfoError,
  } = useGetEmergencyAdminInfo({
    chainId,
    marketConfigurator,
    actionType: action.type,
  });

  const {
    data: emergencyTx,
    isLoading: isLoadingTx,
    error: txError,
  } = useGetEmergencyTx({
    chainId,
    marketConfigurator,
    action,
  });

  const {
    data: sdk,
    isLoading: isLoadingSdk,
    error: sdkError,
  } = useSDK({
    chainId,
    configurators: [marketConfigurator],
  });

  const marketConfiguratorContract = useMemo(
    () =>
      (sdk?.marketRegister.marketConfigurators ?? []).find(
        (mc) => mc.address.toLowerCase() === marketConfigurator.toLowerCase()
      ),
    [marketConfigurator, sdk?.marketRegister.marketConfigurators]
  );

  if (isLoadingMcInfo || isLoadingAdminInfo || isLoadingSdk || isLoadingTx) {
    return (
      <div className="divide-y divide-gray-800 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="h-6 w-1/3 bg-gray-800 rounded mb-4" />
            <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
            <div className="h-4 w-1/4 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (
    adminInfoError ||
    mcInfoError ||
    sdkError ||
    txError ||
    !mcInfo?.curatorName ||
    !adminInfo ||
    !marketConfiguratorContract
  ) {
    return (
      <div className="p-4">
        <text className="font-semibold text-white">
          Invalid market cofigurator:{" "}
          {adminInfoError?.message ||
            mcInfoError?.message ||
            sdkError?.message ||
            txError?.message ||
            "Unknown address"}
        </text>
      </div>
    );
  }

  if (!emergencyTx || !sdk) return <></>;

  return (
    <PageLayout
      title={`Emergency tx for ${mcInfo.curatorName}`}
      description={
        <div className="flex items-center gap-2 text-gray-100">
          <div className="text-sm text-muted-foreground break-all">
            {chain?.name ?? chainId} · {shortenHash(marketConfigurator)}
          </div>
          <CopyButton text={marketConfigurator} size="3.5" />
          {chain?.blockExplorers.default.url && (
            <ExternalButton
              url={`${chain.blockExplorers.default.url}/address/${marketConfigurator}`}
              size="3.5"
            />
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {adminInfo.type === "safe" ? (
          <EmergencySafeTx
            chainId={chainId}
            sdk={sdk}
            emergencyTx={emergencyTx}
            adminInfo={adminInfo}
          />
        ) : (
          <EmergencyEoaTx
            chainId={chainId}
            sdk={sdk}
            emergencyTx={emergencyTx}
            adminInfo={adminInfo}
          />
        )}
      </div>
    </PageLayout>
  );
}
