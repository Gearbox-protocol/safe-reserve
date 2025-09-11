import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmergencyTx } from "@/core/emergency-actions";
import { EmergencyAdminInfo, useSendEoaEmergencyTx } from "@/hooks";
import { useState } from "react";
import { useAccount } from "wagmi";
import { DownloadTxButton } from "../download-tx-button";

interface ButtonTxProps {
  chainId: number;
  emergencyTx: EmergencyTx;
  admin: EmergencyAdminInfo;
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
          admin={admin.emergencyAdmin}
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
                  onClick={async (e) => {
                    if (!isSendPending) {
                      e.stopPropagation();
                      const isTxSent = await sendTx();
                      setIsSent(!!isTxSent);
                    }
                  }}
                  disabled={
                    address?.toLowerCase() !==
                      admin.emergencyAdmin.toLowerCase() || isSent
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
              {address?.toLowerCase() !==
                admin.emergencyAdmin.toLowerCase() && (
                <TooltipContent>
                  <p>Connect as emergency admin to execute tx</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
