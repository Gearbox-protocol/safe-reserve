import { EmergencyTx } from "@/core/emergency-actions";
import { AdminInfo, useSendEoaEmergencyTx } from "@/hooks";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@gearbox-protocol/permissionless-ui";
import { useState } from "react";
import { useAccount } from "wagmi";
import { DownloadTxButton } from "../download-tx-button";

interface ButtonTxProps {
  chainId: number;
  emergencyTx: EmergencyTx;
  admin: AdminInfo;
}

export function EoaEmergencyTxButton({
  chainId,
  emergencyTx,
  admin,
}: ButtonTxProps) {
  const [isSent, setIsSent] = useState(false);
  const { address } = useAccount();

  const { send: sendTx, isPending: isSendPending } = useSendEoaEmergencyTx({
    chainId,
    emergencyTx,
  });

  return (
    <div className="flex items-center gap-4">
      {admin.type === "unknown" && (
        <DownloadTxButton
          chainId={chainId}
          admin={admin.admin}
          emergencyTx={emergencyTx}
        />
      )}
      {admin.type === "eoa" && (
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async (e) => {
                    if (!isSendPending) {
                      e.stopPropagation();
                      const isTxSent = await sendTx();
                      setIsSent(!!isTxSent);
                    }
                  }}
                  disabled={
                    address?.toLowerCase() !== admin.admin.toLowerCase() ||
                    isSent
                  }
                  className="px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 min-w-[100px]"
                >
                  {isSendPending
                    ? "Executing.."
                    : isSent
                      ? "Executed"
                      : "Execute"}
                </Button>
              </TooltipTrigger>
              {address?.toLowerCase() !== admin.admin.toLowerCase() && (
                <TooltipContent>
                  <p>{`Connect as ${emergencyTx.action.type.startsWith("MULTI_PAUSE::") ? "pausable" : "emergency"} admin to execute tx`}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
