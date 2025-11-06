"use client";

import { SkeletonStacks } from "@/components/ui/skeleton";
import { chains } from "@/config/wagmi";
import { EmergencyActions } from "@/core/emergency-actions";
import {
  useGetEmergencyAdminInfo,
  useGetEmergencyTx,
  useGetMarketConfiguratorInfo,
  useSDK,
} from "@/hooks";
import {
  CopyButton,
  ExternalButton,
  PageLayout,
} from "@gearbox-protocol/permissionless-ui";
import { shortenHash } from "@gearbox-protocol/sdk/permissionless";
import { useEffect, useMemo } from "react";
import { Address } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
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
  const currentChain = chains.find(({ id }) => id === chainId);

  const { switchChain } = useSwitchChain();
  const { chain } = useAccount();

  useEffect(() => {
    if (!!chainId && chainId !== chain?.id) {
      switchChain({ chainId });
    }
  }, [chain?.id, chainId, switchChain]);

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
    return <SkeletonStacks />;
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
            {currentChain?.name ?? chainId} · {shortenHash(marketConfigurator)}
          </div>
          <CopyButton text={marketConfigurator} />
          {currentChain?.blockExplorers.default.url && (
            <ExternalButton
              url={`${currentChain.blockExplorers.default.url}/address/${marketConfigurator}`}
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
