"use client";

import { InstanceProposalSignatures } from "@/components/txs/instance/instance-proposal-signatures";
import { SkeletonStacks } from "@/components/ui/skeleton";
import { emergencyActionsMap } from "@/core/emergency-actions";
import { useBuildEmergencySafeTx } from "@/hooks";
import { CardTitle, ExpandableCard } from "@gearbox-protocol/permissionless-ui";
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
    <ExpandableCard
      alwaysExpanded
      header={
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{emergencyTx.action.type}</CardTitle>
            <div className="text-muted-foreground text-sm">
              {actionMeta?.description}
            </div>
          </div>

          {tx && (
            <SafeEmergencyTxButton
              chainId={chainId}
              tx={tx}
              emergencyTx={emergencyTx}
              safeAddress={adminInfo.admin}
            />
          )}
        </div>
      }
    >
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
          <div>
            {Object.keys(emergencyTx.action.params ?? {}).length > 0 && (
              <RenderedParams sdk={sdk} action={emergencyTx.action} />
            )}
          </div>

          <div className="border-l pl-8">
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
    </ExpandableCard>
  );
}
