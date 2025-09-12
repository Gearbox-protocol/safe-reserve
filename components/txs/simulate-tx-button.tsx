import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormattedTrace } from "@/components/ui/formatted-trace";
import { ParsedSignedTx, SignedTx } from "@/core/safe-tx";
import { useSimulateGovernorTx } from "@/hooks/actions/use-simulate-governor-tx";
import { useSimulateInstanceTx } from "@/hooks/actions/use-simulate-instance-tx";
import { CheckCircle, Eye, Loader2, Play, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Address } from "viem";

interface SimulateTxButtonProps {
  tx: SignedTx | ParsedSignedTx;
  safeAddress: Address;
  governor: Address;
  instanceManager: Address;
  isGovernorTxs: boolean;
}

function GovernorSimulateTxButton({
  tx,
  safeAddress,
  governor,
}: {
  tx: ParsedSignedTx;
  safeAddress: Address;
  governor: Address;
}) {
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isTraceDialogOpen, setIsTraceDialogOpen] = useState(false);
  const { data, isLoading, error, simulate } = useSimulateGovernorTx(safeAddress, governor, tx);
  
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
  tx,
  safeAddress,
  instanceManager,
}: {
  tx: SignedTx;
  safeAddress: Address;
  instanceManager: Address;
}) {
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isTraceDialogOpen, setIsTraceDialogOpen] = useState(false);
  const { data, isLoading, error, simulate } = useSimulateInstanceTx(safeAddress, instanceManager, tx);
  
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

function SimulateTxButtonComponent({
  data,
  isLoading,
  error,
  simulate,
  hasSimulated,
  setHasSimulated,
  isTraceDialogOpen,
  setIsTraceDialogOpen,
}: {
  data: {
    success: boolean;
    result: string;
    gasEstimate: bigint;
    fromatTrace?: string;
  } | undefined;
  isLoading: boolean;
  error: Error | null;
  simulate: () => void;
  hasSimulated: boolean;
  setHasSimulated: (value: boolean) => void;
  isTraceDialogOpen: boolean;
  setIsTraceDialogOpen: (value: boolean) => void;
}) {
  // Handle success/error notifications
  useEffect(() => {
    if (hasSimulated && !isLoading) {
      if (error) {
        toast.error(`Simulation failed: ${error.message}`);
      } else if (data) {
        if (data.success) {
          toast.success("Transaction simulation successful");
        } else {
          toast.error("Transaction simulation failed - transaction would revert");
        }
      }
    }
  }, [hasSimulated, isLoading, error, data]);

  const handleSimulate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If simulation already done and failed with trace, show trace dialog
    if (hasSimulated && data && !data.success && data.fromatTrace) {
      setIsTraceDialogOpen(true);
      return;
    }
    
    // Only allow simulation if not already simulated
    if (hasSimulated) {
      return;
    }
    
    setHasSimulated(true);
    simulate();
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Simulating...
        </>
      );
    }
    
    if (hasSimulated) {
      if (error) {
        return (
          <>
            <XCircle className="h-3 w-3" />
            Failed
          </>
        );
      }
      if (data) {
        if (data.success) {
          return (
            <>
              <CheckCircle className="h-3 w-3" />
              Success
            </>
          );
        } else {
          // Show trace view button when simulation failed and trace is available
          if (data.fromatTrace) {
            return (
              <>
                <Eye className="h-3 w-3" />
                View Trace
              </>
            );
          }
          return (
            <>
              <XCircle className="h-3 w-3" />
              Failed
            </>
          );
        }
      }
    }
    
    return (
      <>
        <Play className="h-3 w-3" />
        Simulate
      </>
    );
  };

  const getButtonClassName = () => {
    const baseClasses = "px-4 py-1 text-xs bg-transparent border";
    
    if (isLoading) {
      return `${baseClasses} border-blue-500 text-blue-500 hover:bg-blue-500/10`;
    }
    
    if (hasSimulated) {
      if (error) {
        return `${baseClasses} border-red-500 text-red-500 hover:bg-red-500/10`;
      }
      if (data) {
        if (data.success) {
          return `${baseClasses} border-green-500 text-green-500 hover:bg-green-500/10`;
        } else {
          return `${baseClasses} border-red-500 text-red-500 hover:bg-red-500/10`;
        }
      }
    }
    
    return `${baseClasses} border-blue-500 text-blue-500 hover:bg-blue-500/10`;
  };

  const isButtonDisabled = isLoading || (hasSimulated && !(data && !data.success && data.fromatTrace));

  return (
    <Dialog open={isTraceDialogOpen} onOpenChange={setIsTraceDialogOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSimulate}
        disabled={isButtonDisabled}
        className={getButtonClassName()}
      >
        {getButtonContent()}
      </Button>
      
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Transaction Trace</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[60vh] bg-gray-900 p-4 rounded-lg">
          <FormattedTrace 
            content={data?.fromatTrace || ''} 
            className="text-xs text-gray-100"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SimulateTxButton({
  tx,
  safeAddress,
  governor,
  instanceManager,
  isGovernorTxs,
}: SimulateTxButtonProps) {
  if (isGovernorTxs) {
    return (
      <GovernorSimulateTxButton
        tx={tx as ParsedSignedTx}
        safeAddress={safeAddress}
        governor={governor}
      />
    );
  }
  
  return (
    <InstanceSimulateTxButton
      tx={tx}
      safeAddress={safeAddress}
      instanceManager={instanceManager}
    />
  );
}
