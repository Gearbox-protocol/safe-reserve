"use client";

import { InstanceProposalSignatures } from "@/components/txs/instance/instance-proposal-signatures";
import { SkeletonStacks } from "@/components/ui/skeleton";
import { emergencyActionsMap } from "@/core/emergency-actions";
import { useBuildEmergencySafeTx } from "@/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gearbox-protocol/permissionless-ui";
import { useEffect, useState } from "react";
import { RenderedParams } from "../rendered-tx-params";
import { EmergencyTxProps } from "../types";
import { SafeEmergencyTxButton } from "./safe-emergency-tx-button";

export function EmergencySafeTx({
  sdk,
  chainId,
  emergencyTx,
  adminInfo,
}: EmergencyTxProps) {
  const actionMeta = emergencyActionsMap[emergencyTx.action.type];

  const [nonce, setNonce] = useState<number>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const nonce = params.get("nonce");

    if (!!nonce) {
      setNonce(+nonce);
    } else if (adminInfo.type === "safe") {
      setNonce(adminInfo.info.nonce);
    }
  }, [adminInfo]);

  const {
    tx,
    isLoading: isLoadingTx,
    error: errorTx,
  } = useBuildEmergencySafeTx({
    chainId,
    safe: adminInfo.admin,
    emergencyTx,
    nonce,
  });

  if (adminInfo.type !== "safe") return <></>;

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{emergencyTx.action.type}</CardTitle>
          {tx && (
            <SafeEmergencyTxButton
              chainId={chainId}
              tx={tx}
              emergencyTx={emergencyTx}
              safeAddress={adminInfo.admin}
            />
          )}
        </div>
        <div className="text-gray-300 text-sm font-normal">
          {actionMeta?.description}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-sm w-full">
        {!tx ? (
          isLoadingTx ? (
            <SkeletonStacks />
          ) : (
            <div className="space-y-2 p-4">
              Something went wrong loading tx:{" "}
              {errorTx?.message ?? "Unable to get safe transaction"}
            </div>
          )
        ) : (
          <div className="grid grid-cols-[1fr_minmax(300px,max-content)] gap-12 overflow-x-auto">
            <>
              {Object.keys(emergencyTx.action.params ?? {}).length > 0 && (
                <div className="border-t border-gray-800 pt-3">
                  <div className="font-semibold text-gray-200 mb-2 text-lg">
                    Params
                  </div>
                  <RenderedParams sdk={sdk} action={emergencyTx.action} />
                </div>
              )}
            </>

            <div className="border-l border-gray-800 pl-8">
              <InstanceProposalSignatures
                chainId={chainId}
                signers={tx.signedBy || []}
                safeAddress={adminInfo.admin}
                nonce={nonce}
                isExecuted={false}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
