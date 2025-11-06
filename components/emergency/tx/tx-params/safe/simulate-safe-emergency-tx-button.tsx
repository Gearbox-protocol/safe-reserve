import { SimulateTxButtonComponent } from "@/components/ui/simulate-tx-button-component";
import { EmergencyTx } from "@/core/emergency-actions";
import { SignedTx } from "@/core/safe-tx";
import { useSimulateEmergencyTx } from "@/hooks/simulate/use-simulate-emergency-tx";
import { useState } from "react";
import { Address } from "viem";

export function SimulateSafeEmergencyTxButton({
  chainId,
  tx,
  emergencyTx,
  safeAddress,
}: {
  chainId: number;
  tx: SignedTx;
  emergencyTx: EmergencyTx;
  safeAddress: Address;
}) {
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isTraceDialogOpen, setIsTraceDialogOpen] = useState(false);
  const { data, isLoading, error, simulate } = useSimulateEmergencyTx(
    chainId,
    safeAddress,
    tx,
    emergencyTx
  );

  return (
    <SimulateTxButtonComponent
      data={data}
      isLoading={isLoading}
      error={error}
      simulate={simulate}
      hasSimulated={hasSimulated}
      setHasSimulated={setHasSimulated}
      isTraceDialogOpen={isTraceDialogOpen}
      setIsTraceDialogOpen={setIsTraceDialogOpen}
    />
  );
}
