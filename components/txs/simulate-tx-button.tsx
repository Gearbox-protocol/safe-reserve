import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { FormattedTrace } from "@/components/ui/formatted-trace";
import { SignedTx, ParsedSignedTx } from "@/core/safe-tx";
import { useSimulateTx } from "@/hooks/actions/use-simulate-tx";
import { Play, Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Address } from "viem";

interface SimulateTxButtonProps {
  tx: SignedTx | ParsedSignedTx;
  safeAddress: Address;
  instanceManager: Address;
}

export function SimulateTxButton({
  tx,
  safeAddress,
  instanceManager,
}: SimulateTxButtonProps) {
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isTraceDialogOpen, setIsTraceDialogOpen] = useState(false);
  const { data, isLoading, error, simulate } = useSimulateTx(safeAddress, instanceManager, tx);

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
    simulate(undefined, {
      onSuccess: (result) => {
        if (result?.success) {
          toast.success("Transaction simulation successful");
        } else {
          toast.error("Transaction simulation failed - transaction would revert");
        }
      },
      onError: (error) => {
        toast.error(`Simulation failed: ${error.message}`);
      }
    });
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
