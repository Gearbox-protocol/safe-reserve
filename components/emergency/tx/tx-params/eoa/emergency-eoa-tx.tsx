"use client";

import { emergencyActionsMap } from "@/core/emergency-actions";
import {
  CardDescription,
  CardTitle,
  ExpandableCard,
} from "@gearbox-protocol/permissionless-ui";
import { RenderedParams } from "../rendered-tx-params";
import { EmergencyTxProps } from "../types";
import { EoaEmergencyTxButton } from "./eoa-emergency-tx-button";

export function EmergencyEoaTx({
  sdk,
  chainId,
  emergencyTx,
  adminInfo,
}: EmergencyTxProps) {
  const actionMeta = emergencyActionsMap[emergencyTx.action.type];

  if (adminInfo.type === "safe") return <></>;

  return (
    <ExpandableCard
      alwaysExpanded
      header={
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{emergencyTx.action.type}</CardTitle>
            <CardDescription>{actionMeta?.description}</CardDescription>
          </div>

          <EoaEmergencyTxButton
            chainId={chainId}
            emergencyTx={emergencyTx}
            admin={adminInfo}
          />
        </div>
      }
    >
      {Object.keys(emergencyTx.action.params ?? {}).length > 0 && (
        <RenderedParams sdk={sdk} action={emergencyTx.action} />
      )}
    </ExpandableCard>
  );
}
