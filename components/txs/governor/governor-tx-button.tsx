"use client";

import { ParsedSignedTx } from "@/core/safe-tx";
import {
  useIsSafeApp,
  useSafeParams,
  useSendGovernorTx,
  useSignTx,
} from "@/hooks";
import { formatTimeRemaining } from "@/utils/format";
import { TimelockTxStatus } from "@/utils/tx-status";
import { Button } from "@gearbox-protocol/permissionless-ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { TransactionInfoDialog } from "../transaction-info-dialog";

interface ButtonTxProps {
  cid: string;
  chainId: number;
  tx: ParsedSignedTx;
  safeAddress: Address;
  governor: Address;
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

export function GovernorButtonTx({
  cid,
  chainId,
  tx,
  safeAddress,
  governor,
}: ButtonTxProps) {
  const [isSent, setIsSent] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  const { signers, threshold, nonce } = useSafeParams(chainId, safeAddress);
  const { address } = useAccount();

  const { sdk } = useSafeAppsSDK();
  const isSafeApp = useIsSafeApp(safeAddress);

  const { send: sendTx, isPending: isSendPending } = useSendGovernorTx(
    chainId,
    safeAddress,
    governor,
    tx
  );
  const { sign: signTx, isPending: isSignPending } = useSignTx({
    chainId,
    cid,
    safeAddress,
    onSuccess: (txHash) => {
      if (txHash.toLowerCase() === tx.hash.toLowerCase()) {
        setAlreadySigned(true);
      }
    },
  });

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
    return isSafeApp || (!isSendPending && !canSend);
  }, [isSafeApp, isSendPending, canSend]);

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
