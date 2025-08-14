import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ParsedSignedTx } from "@/core/safe-tx";
import { useIsSafeApp, useSafeParams, useSendTx, useSignTx } from "@/hooks";
import { formatTimeRemaining } from "@/utils/format";
import { TimelockTxStatus } from "@/utils/tx-status";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { Info, Wallet, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";

interface ButtonTxProps {
  tx: ParsedSignedTx;
  safeAddress: Address;
  governor: Address;
  cid: string;
}

const getButtonText = (status: TimelockTxStatus, eta: number = 0) => {
  switch (status) {
    case TimelockTxStatus.Queued: {
      return `ETA is in ${formatTimeRemaining(eta)}`;
    }
    case TimelockTxStatus.Executed: {
      return "Executed";
    }
    case TimelockTxStatus.Canceled: {
      return "Canceled";
    }
    case TimelockTxStatus.Stale: {
      return "Skipped";
    }
    case TimelockTxStatus.NotFound: {
      return "Queue";
    }
    case TimelockTxStatus.Ready: {
      return "Execute";
    }
  }
};

const TransactionInfoDialog = ({ isConfirmButton, canSend }: { isConfirmButton: boolean; canSend?: boolean }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 ml-2 text-gray-400 hover:text-white transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <Info className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl">
          {isConfirmButton ? "Confirm Transaction" : "Execute Transaction"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {isConfirmButton ? (
          <>
            <p className="text-sm text-gray-300 mb-4">
              The Confirm button approves the transaction hash on-chain:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 mt-0.5">
                  <Wallet className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">On-Chain Approval</h4>
                  <p className="text-sm text-gray-400">Approve the transaction hash on-chain to add your signature</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400">
                <strong>Note:</strong> This adds your approval to the Safe. Once enough signers have confirmed, 
                the transaction can be executed.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-300 mb-4">
              {canSend 
                ? "The Execute button directly sends the transaction:"
                : "The Execute button triggers a 2-step process:"
              }
            </p>
            
            <div className="space-y-3">
              {!canSend && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 mt-0.5">
                    <Wallet className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">1. Off-Chain Signature</h4>
                    <p className="text-sm text-gray-400">Sign the transaction hash off-chain in your wallet</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 mt-0.5">
                  <Play className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{canSend ? "Multicall3 Execution" : "2. Multicall3 Execution"}</h4>
                  <p className="text-sm text-gray-400">Send a single Multicall3 transaction that pulls price updates and executes the Safe batch</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400">
                <strong>Note:</strong> {canSend 
                  ? "Enough signatures have been collected. This directly executes with the most current price data."
                  : "This ensures your transaction executes with the most current price data, preventing potential issues with outdated feeds."
                }
              </p>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export function ButtonTx({ tx, safeAddress, governor, cid }: ButtonTxProps) {
  const [isSent, setIsSent] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  const { signers, threshold, nonce } = useSafeParams(safeAddress);
  const { address } = useAccount();

  const { sdk } = useSafeAppsSDK();
  const isSafeApp = useIsSafeApp(safeAddress);

  const { send: sendTx, isPending: isSendPending } = useSendTx(
    safeAddress,
    governor,
    tx
  );
  const { sign: signTx, isPending: isSignPending } = useSignTx(
    cid,
    safeAddress,
    (txHash) => {
      if (txHash.toLowerCase() === tx.hash.toLowerCase()) {
        setAlreadySigned(true);
      }
    }
  );

  const canSign = useMemo(() => {
    return (
      !alreadySigned &&
      // TODO: check tx was not added
      (isSafeApp ||
        ((signers || [])
          .map((addr) => addr.toLowerCase())
          .some((s) => s === address?.toLowerCase()) &&
          !tx.signedBy
            .map((s) => s.toLowerCase())
            .includes(address?.toLowerCase() || zeroAddress)))
    );
  }, [signers, address, tx.signedBy, alreadySigned, isSafeApp]);

  const [canSignaAndSend, canSend] = useMemo(() => {
    return [
      canSign && tx.signedBy.length + 1 >= Number(threshold || 0n),
      tx.signedBy.length >= Number(threshold || 0n),
    ];
  }, [canSign, threshold, tx.signedBy]);

  const isNonceReady = useMemo(() => {
    return tx.nonce === (nonce || 0n);
  }, [nonce, tx.nonce]);

  const isSignButton = useMemo(() => {
    return (
      isSafeApp || (!isSendPending && !canSend)
    );
  }, [isSafeApp, isSendPending, canSend, threshold]);

  const isSendButton = useMemo(() => {
    return !isSafeApp && (canSend || (!isSignPending && canSignaAndSend));
  }, [isSafeApp, canSend, isSignPending, canSignaAndSend]);

  if (
    [
      TimelockTxStatus.Stale,
      TimelockTxStatus.Queued,
      TimelockTxStatus.Canceled,
      TimelockTxStatus.Executed,
    ].includes(tx.status)
  ) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-white"></span>
        <span className="text-white">{getButtonText(tx.status, tx.eta)}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {isSignButton && (
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={async (e) => {
              if (!isSignPending) {
                e.stopPropagation();
                if (isSafeApp) {
                  await sdk.txs.send({
                    txs: tx.calls.map((tx) => ({
                      ...tx,
                      value: tx.value.toString(),
                    })),
                  });
                } else {
                  await signTx({ txHash: tx.hash });
                }
              }
            }}
            disabled={!canSign}
            className={`px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 ${
              !canSign && "border-gray-600 text-gray-600 hover:bg-transparent"
            }`}
          >
            {isSignPending ? "Signing..." : "Confirm"}
          </Button>
          <TransactionInfoDialog isConfirmButton={true} />
        </div>
      )}

      {isSendButton && (
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={async (e) => {
              if (!isSendPending) {
                e.stopPropagation();
                const isTxSent = await sendTx();
                setIsSent(!!isTxSent);
              }
            }}
            disabled={!isNonceReady || isSent}
            className="px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 min-w-[100px]"
          >
            {isSent
              ? TimelockTxStatus.NotFound
                ? "Queued"
                : "Executed"
              : isNonceReady
                ? isSendPending
                  ? TimelockTxStatus.NotFound
                    ? "Queueing.."
                    : "Executing.."
                  : getButtonText(tx.status, tx.eta)
                : "Ready"}
          </Button>
          <TransactionInfoDialog isConfirmButton={false} canSend={canSend} />
        </div>
      )}
    </div>
  );
}
