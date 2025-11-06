import { ExtendedSignedTx, ParsedSignedTx } from "@/core/safe-tx";
import { useSimulateGovernorTx } from "@/hooks/simulate/use-simulate-governor-tx";
import { useSimulateInstanceTx } from "@/hooks/simulate/use-simulate-instance-tx";
import { useState } from "react";
import { Address } from "viem";
import { SimulateTxButtonComponent } from "../ui/simulate-tx-button-component";

interface SimulateTxButtonProps {
  chainId: number;
  tx: ExtendedSignedTx | ParsedSignedTx;
  safeAddress: Address;
  governor: Address;
  instanceManager: Address;
  isGovernorTxs: boolean;
}

function GovernorSimulateTxButton({
  chainId,
  tx,
  safeAddress,
  governor,
}: {
  chainId: number;
  tx: ParsedSignedTx;
  safeAddress: Address;
  governor: Address;
}) {
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isTraceDialogOpen, setIsTraceDialogOpen] = useState(false);
  const { data, isLoading, error, simulate } = useSimulateGovernorTx(
    chainId,
    safeAddress,
    governor,
    tx
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

function InstanceSimulateTxButton({
  chainId,
  tx,
  safeAddress,
  instanceManager,
}: {
  chainId: number;
  tx: ExtendedSignedTx;
  safeAddress: Address;
  instanceManager: Address;
}) {
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isTraceDialogOpen, setIsTraceDialogOpen] = useState(false);
  const { data, isLoading, error, simulate } = useSimulateInstanceTx(
    chainId,
    safeAddress,
    instanceManager,
    tx
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

export function SimulateTxButton({
  chainId,
  tx,
  safeAddress,
  governor,
  instanceManager,
  isGovernorTxs,
}: SimulateTxButtonProps) {
  if (isGovernorTxs) {
    return (
      <GovernorSimulateTxButton
        chainId={chainId}
        tx={tx as ParsedSignedTx}
        safeAddress={safeAddress}
        governor={governor}
      />
    );
  }

  return (
    <InstanceSimulateTxButton
      chainId={chainId}
      tx={tx}
      safeAddress={safeAddress}
      instanceManager={instanceManager}
    />
  );
}
