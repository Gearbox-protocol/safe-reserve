"use client";

import { emergencyActionsMap } from "@/core/emergency-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
    <Card>
      <CardHeader className="justify-between items-start p-4">
        <div>
          <CardTitle className="text-xl">{emergencyTx.action.type}</CardTitle>
          <div className="text-muted-foreground text-sm">
            {actionMeta?.description}
          </div>
        </div>

        <EoaEmergencyTxButton
          chainId={chainId}
          emergencyTx={emergencyTx}
          admin={adminInfo}
        />
      </CardHeader>
      <CardContent className="bg-gray-900/30">
        {Object.keys(emergencyTx.action.params ?? {}).length > 0 && (
          <RenderedParams sdk={sdk} action={emergencyTx.action} />
        )}
      </CardContent>
    </Card>
  );
}
