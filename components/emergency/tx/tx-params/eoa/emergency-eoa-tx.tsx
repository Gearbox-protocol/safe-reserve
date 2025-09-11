"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { emergencyActionsMap } from "@/core/emergency-actions";
import { RenderedParams } from "../rendered-tx-params";
import { EmergencyTxProps } from "../types";
import { EoaEmergencyTxButton } from "./eoa-emergency-tx-button";

export function EmergencyEoaTx({
  chainId,
  emergencyTx,
  emergencyAdminInfo,
}: EmergencyTxProps) {
  const actionMeta = emergencyActionsMap[emergencyTx.action.type];

  if (emergencyAdminInfo.type === "safe") return <></>;

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{emergencyTx.action.type}</CardTitle>

          <EoaEmergencyTxButton
            chainId={chainId}
            emergencyTx={emergencyTx}
            admin={emergencyAdminInfo}
          />
        </div>

        <div className="text-gray-300 text-sm font-normal">
          {actionMeta?.description}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-sm">
        <div className="border-t border-gray-800 pt-3">
          <div className="font-semibold text-gray-200 mb-2">Params</div>
          <RenderedParams action={emergencyTx.action} />
        </div>
      </CardContent>
    </Card>
  );
}
