import { SafeTx } from "@/core/safe-tx";
import { useExecuteTx } from "@/hooks/use-execute-tx";
import { useSafeParams } from "@/hooks/use-safe-params";
import { useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { Button } from "../ui/button";
import { useSignTx } from "@/hooks/use-sign-tx";

interface ButtonTxProps {
  tx: SafeTx;
  safeAddress: Address;
  isQueue: boolean;
}

export function ButtonTx({ tx, safeAddress, isQueue }: ButtonTxProps) {
  const { sign: executeTx, isPending: isExecutePending } = useExecuteTx(
    safeAddress,
    tx
  );

  const [alreadySigned, setAlreadySigned] = useState(false);
  const { sign: signTx, isPending: isSignPending } = useSignTx(
    safeAddress,
    (txHash) => {
      if (txHash.toLowerCase() === tx.hash.toLowerCase()) {
        setAlreadySigned(true);
      }
    }
  );
  const { signers, threshold, nonce } = useSafeParams(safeAddress);
  const { address } = useAccount();

  const canSign = useMemo(() => {
    return (
      !alreadySigned &&
      (signers || [])
        .map((addr) => addr.toLowerCase())
        .some((s) => s === address?.toLowerCase()) &&
      !tx.signedBy
        .map((s) => s.toLowerCase())
        .includes(address?.toLowerCase() || zeroAddress)
    );
  }, [signers, address, tx.signedBy, alreadySigned]);

  const canExecute = tx.signedBy.length >= Number(threshold || 0n);
  const isNonceReady = tx.nonce === (nonce || 0n);

  if (!isQueue) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-white"></span>
        <span className="text-white">Signed</span>
      </span>
    );
  }

  if (canExecute) {
    return (
      <Button
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          executeTx({ txHash: tx.hash });
        }}
        disabled={!isNonceReady}
        className="px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 min-w-[100px]"
      >
        {isNonceReady
          ? isExecutePending
            ? "Executing..."
            : "Execute"
          : "Ready"}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={(e) => {
        e.stopPropagation();
        signTx({ txHash: tx.hash });
      }}
      disabled={!canSign}
      className={`px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 ${
        !canSign && "border-gray-600 text-gray-600 hover:bg-transparent"
      }`}
    >
      {isSignPending ? "Signing..." : "Confirm"}
    </Button>
  );
}
