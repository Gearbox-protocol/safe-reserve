import { EmergencyTx } from "@/core/emergency-actions";
import { useTransactionDownload } from "@/hooks";
import { Button } from "@gearbox-protocol/permissionless-ui";
import { Download } from "lucide-react";
import { useState } from "react";
import { Address } from "viem";

interface ButtonTxProps {
  chainId: number;
  admin: Address;
  emergencyTx: EmergencyTx;
}

export function DownloadTxButton({
  chainId,
  admin,
  emergencyTx,
}: ButtonTxProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { downloadTransaction } = useTransactionDownload();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isLoading}
      onClick={async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const splittedType = emergencyTx.action.type
          .replace("_", "-")
          .split("::");
        const name = splittedType?.[0].toLowerCase() + "-" + splittedType?.[1];
        await downloadTransaction({
          chainId,
          safeAddress: admin,
          txs: [emergencyTx.tx],
          name: name,
        });

        setIsLoading(false);
      }}
    >
      <Download className="h-4 w-4 mr-2" />
      {isLoading ? "Downloading..." : "Download Tx"}
    </Button>
  );
}
