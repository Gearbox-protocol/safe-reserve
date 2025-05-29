import { ParsedSignedTx } from "@/core/safe-tx";
import { useExecuteTx } from "@/hooks/use-execute-tx";
import { useSafeParams } from "@/hooks/use-safe-params";
import { useSignTx } from "@/hooks/use-sign-tx";
import { useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";

import { useTimelockExecuteTx } from "../../hooks/use-timelock-execute-tx";
import { formatTimeRemaining } from "../../utils/format";
import { TimelockTxStatus } from "../../utils/tx-status";
import { Button } from "../ui/button";
import { TabType } from "./view-tx-list";

interface ButtonTxProps {
  tx: ParsedSignedTx;
  safeAddress: Address;
  activeTab: TabType;
}

export function ButtonTx({ tx, safeAddress, activeTab }: ButtonTxProps) {
  const { sign: executeTx, isPending: isExecutePending } = useExecuteTx(
    safeAddress,
    tx
  );

  const [isExecuted, setIsExecuted] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const { sign: signTx, isPending: isSignPending } = useSignTx(
    safeAddress,
    (txHash) => {
      if (txHash.toLowerCase() === tx.hash.toLowerCase()) {
        setAlreadySigned(true);
      }
    }
  );

  const { sign: timelockExecuteTx, isPending: isTimelockExecutePending } =
    useTimelockExecuteTx(safeAddress, tx);

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

  const [canSignaAndExecute, canExecute] = useMemo(() => {
    return [
      canSign && tx.signedBy.length + 1 >= Number(threshold || 0n),
      tx.signedBy.length >= Number(threshold || 0n),
    ];
  }, [canSign, threshold, tx.signedBy]);

  const isNonceReady = useMemo(() => {
    return tx.nonce === (nonce || 0n);
  }, [nonce, tx.nonce]);

  const isSignButton = useMemo(() => {
    return !isExecutePending && !canExecute;
  }, [isExecutePending, canExecute]);

  const isExecuteButton = useMemo(() => {
    return canExecute || (!isSignPending && canSignaAndExecute);
  }, [canExecute, isSignPending, canSignaAndExecute]);

  if (activeTab === "history") {
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-white"></span>
        <span className="text-white">
          {tx.status === TimelockTxStatus.Stale
            ? "Skipped"
            : tx.status === TimelockTxStatus.Canceled
              ? "Canceled"
              : " Executed"}
        </span>
      </span>
    );
  }

  if (activeTab === "execute") {
    return (
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={async (e) => {
            e.stopPropagation();
            const isExecuted = await timelockExecuteTx();
            setIsExecuted(!!isExecuted);
          }}
          disabled={tx.status !== TimelockTxStatus.Ready || isExecuted}
          className="px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 min-w-[100px]"
        >
          {isExecuted
            ? "Executed"
            : tx.status !== TimelockTxStatus.Ready
              ? `ETA is in ${formatTimeRemaining(tx.eta)}`
              : isTimelockExecutePending
                ? "Executing..."
                : "Execute"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {isSignButton && (
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
      )}

      {isExecuteButton && (
        <Button
          variant="outline"
          onClick={async (e) => {
            e.stopPropagation();
            const isExecuted = await executeTx();
            setIsExecuted(!!isExecuted);
          }}
          disabled={!isNonceReady || isExecuted}
          className="px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 min-w-[100px]"
        >
          {isExecuted
            ? "Queued "
            : isNonceReady
              ? isExecutePending
                ? "Queueing..."
                : "Queue"
              : "Ready"}
        </Button>
      )}
    </div>
  );
}
