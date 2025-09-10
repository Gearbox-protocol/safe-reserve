"use client";

import { emergencyActionsMap } from "@/core/emergency-actions";
import { EmergencyTx } from "@/core/emergency-actions/types";
import { EmergencyAdminInfo, useBuildEmergencySafeTx } from "@/hooks";
import { useEffect, useState } from "react";
import { InstanceProposalSignatures } from "../../../txs/instance/instance-proposal-signatures";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { RenderedParams } from "./rendered-tx-params";
import { SafeEmergencyTxButton } from "./safe-emergency-tx-button";

export function EmergencySafeTx({
  chainId,
  emergencyTx,
  emergencyAdminInfo,
}: {
  chainId: number;
  emergencyTx: EmergencyTx;
  emergencyAdminInfo: EmergencyAdminInfo;
}) {
  const actionMeta = emergencyActionsMap[emergencyTx.action.type];

  const [nonce, setNonce] = useState<number>();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const nonce = params.get("nonce");

    if (!!nonce) {
      setNonce(+nonce);
    } else if (emergencyAdminInfo.type === "safe") {
      setNonce(emergencyAdminInfo.info.nonce);
    }
  }, []);

  const {
    tx,
    isLoading: isLoadingTx,
    error: errorTx,
  } = useBuildEmergencySafeTx({
    chainId,
    safe: emergencyAdminInfo.emergencyAdmin,
    emergencyTx,
    nonce,
  });

  if (emergencyAdminInfo.type !== "safe") return <></>;

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
              safeAddress={emergencyAdminInfo.emergencyAdmin}
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
            <div className="divide-y divide-gray-800 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-6 w-1/3 bg-gray-800 rounded mb-4" />
                  <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
                  <div className="h-4 w-1/4 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 p-4">
              Something went wrong loading tx:{" "}
              {errorTx?.message ?? "Unable to get safe transaction"}
            </div>
          )
        ) : (
          <div className="grid grid-cols-[1fr_minmax(300px,max-content)] gap-12">
            <div className="border-t border-gray-800 pt-3">
              <div className="font-semibold text-gray-200 mb-2">Params</div>
              <RenderedParams action={emergencyTx.action} />
            </div>

            <div className="border-l border-gray-800 pl-8">
              <InstanceProposalSignatures
                signers={tx.signedBy || []}
                safeAddress={emergencyAdminInfo.emergencyAdmin}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
