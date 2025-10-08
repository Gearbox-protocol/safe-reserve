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
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{emergencyTx.action.type}</CardTitle>

          <EoaEmergencyTxButton
            chainId={chainId}
            emergencyTx={emergencyTx}
            admin={adminInfo}
          />
        </div>

        <div className="text-gray-300 text-sm font-normal">
          {actionMeta?.description}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 text-sm">
        {Object.keys(emergencyTx.action.params ?? {}).length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <div className="font-semibold text-gray-200 mb-2 text-lg">
              Params
            </div>
            <RenderedParams sdk={sdk} action={emergencyTx.action} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
