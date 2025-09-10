"use client";

import { chains } from "@/config/wagmi";
import {
  EmergencyActions,
  emergencyActionsMap,
} from "@/core/emergency-actions";
import {
  useGetEmergencyTx,
  useGetMarketConfiguratorInfo,
  useSDK,
} from "@/hooks";
import { shortenHash } from "@gearbox-protocol/permissionless";
import { Copy, ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Address } from "viem";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { PageLayout } from "../../ui/page";
import { ForbidAdapterParamsView } from "./actions/credit-forbid-adapter-params";
import { ForbidBorrowingParamsView } from "./actions/credit-forbid-borrowing-params";
import { ForbidTokenParamsView } from "./actions/credit-forbid-token-params";
import { CreditPauseParamsView } from "./actions/credit-pause-params";
import { SetAccessModeParamsView } from "./actions/loss-policy-set-access-mode-params";
import { SetChecksEnabledParamsView } from "./actions/loss-policy-set-checks-enabled-params";
import { PoolPauseParams } from "./actions/pool-pause-params";
import { SetCreditManagerDebtLimitToZeroParamsView } from "./actions/pool-set-credit-manager-debt-limit-to-zero-params";
import { SetTokenLimitToZeroParamsView } from "./actions/pool-set-token-limit-to-zero-params";

export function EmergencyActionView({
  chainId,
  marketConfigurator,
  action,
}: {
  chainId: number;
  marketConfigurator: Address;
  action: EmergencyActions;
}) {
  const {
    data: mcInfo,
    isLoading: isLoadingInfo,
    error: infoError,
  } = useGetMarketConfiguratorInfo({
    chainId,
    address: marketConfigurator,
  });

  const {
    data: sdk,
    isLoading: isLoadingSdk,
    error: sdkError,
  } = useSDK({
    chainId,
    configurators: [marketConfigurator],
  });

  const chain = chains.find(({ id }) => id === chainId);

  const marketConfiguratorContract = useMemo(
    () =>
      (sdk?.marketRegister.marketConfigurators ?? []).find(
        (mc) => mc.address.toLowerCase() === marketConfigurator.toLowerCase()
      ),
    [marketConfigurator, sdk?.marketRegister.marketConfigurators]
  );

  const actionMeta = emergencyActionsMap[action.type];
  const emergencyTx = useGetEmergencyTx({
    chainId,
    marketConfigurator,
    action,
  });

  if (isLoadingSdk || isLoadingInfo) {
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
    sdkError ||
    infoError ||
    !marketConfiguratorContract ||
    !mcInfo?.curatorName
  ) {
    return (
      <div className="p-4">
        <text className="font-semibold text-white">
          Invalid market cofigurator:{" "}
          {sdkError?.message || infoError?.message || "Unknown address"}
        </text>
      </div>
    );
  }

  if (!emergencyTx) return null;

  function renderParams(a: EmergencyActions) {
    switch (a.type) {
      case "POOL::pause":
        return <PoolPauseParams action={a} />;
      case "POOL::setTokenLimitToZero":
        return <SetTokenLimitToZeroParamsView action={a} />;
      case "POOL::setCreditManagerDebtLimitToZero":
        return <SetCreditManagerDebtLimitToZeroParamsView action={a} />;

      case "CREDIT::forbidToken":
        return <ForbidTokenParamsView action={a} />;
      case "CREDIT::forbidAdapter":
        return <ForbidAdapterParamsView action={a} />;
      case "CREDIT::forbidBorrowing":
        return <ForbidBorrowingParamsView action={a} />;
      case "CREDIT::pause":
        return <CreditPauseParamsView action={a} />;

      case "LOSS_POLICY::setAccessMode":
        return <SetAccessModeParamsView action={a} />;
      case "LOSS_POLICY::setChecksEnabled":
        return <SetChecksEnabledParamsView action={a} />;
      default:
        return null;
    }
  }

  return (
    <PageLayout
      title={`Emergency tx for ${mcInfo.curatorName}`}
      description={
        <div className="flex items-center gap-2 text-gray-100">
          <div className="text-sm text-muted-foreground break-all">
            {chain?.name ?? chainId} • {shortenHash(marketConfigurator)}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-white p-0 h-auto"
            onClick={() => {
              navigator.clipboard.writeText(marketConfigurator);
              toast.success("Address copied to clipboard");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          {chain?.blockExplorers.default.url && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white p-0 h-auto"
              onClick={() =>
                window.open(
                  `${chain?.blockExplorers.default.url}/address/${marketConfigurator}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-xl">{action.type}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3 text-sm">
            <div className="text-gray-300">{actionMeta?.description}</div>

            <div className="border-t border-gray-800 pt-3">
              <div className="font-semibold text-gray-200 mb-2">Params</div>
              {renderParams(action)}
            </div>
          </CardContent>
        </Card>

        {!!emergencyTx && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-xl">MarketTx</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2 text-sm">
              <div className="grid grid-cols-[140px_auto] gap-2">
                <div className="text-gray-400">calldata</div>
                <div className="text-gray-300 break-all font-mono">
                  {emergencyTx.tx.callData}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
