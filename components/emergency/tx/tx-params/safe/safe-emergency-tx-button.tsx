import { TransactionInfoDialog } from "@/components/txs/transaction-info-dialog";
import { Button } from "@/components/ui/button";
import { EmergencyTx } from "@/core/emergency-actions";
import { SignedTx } from "@/core/safe-tx";
import {
  useIsSafeApp,
  useSafeParams,
  useSendSafeEmergencyTx,
  useSignEmergencyTx,
} from "@/hooks";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { DownloadTxButton } from "../download-tx-button";

interface ButtonTxProps {
  chainId: number;
  tx: SignedTx;
  emergencyTx: EmergencyTx;
  safeAddress: Address;
}

export function SafeEmergencyTxButton({
  chainId,
  tx,
  emergencyTx,
  safeAddress,
}: ButtonTxProps) {
  const router = useRouter();

  const [isSent, setIsSent] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  const [urlNonce, setUrlNonce] = useState<number>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const nonce = params.get("nonce");

    if (!!nonce) {
      setUrlNonce(+nonce);
    }
  }, []);

  const { signers, threshold, nonce } = useSafeParams(safeAddress);
  const { address } = useAccount();

  const { sdk } = useSafeAppsSDK();
  const isSafeApp = useIsSafeApp(safeAddress);

  const { send: sendTx, isPending: isSendPending } = useSendSafeEmergencyTx({
    chainId,
    safe: safeAddress,
    tx,
    emergencyTx,
  });

  const { sign: signTx, isPending: isSignPending } = useSignEmergencyTx({
    chainId,
    safe: safeAddress,
    emergencyTx,
    nonce: Number(tx.nonce),
    onSuccess: (txHash) => {
      if (txHash.toLowerCase() === tx.hash.toLowerCase()) {
        setAlreadySigned(true);
      }
    },
  });

  const canSign = useMemo(() => {
    return (
      !alreadySigned &&
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

  return (
    <div className="flex items-center gap-4">
      <DownloadTxButton
        chainId={chainId}
        admin={safeAddress}
        emergencyTx={emergencyTx}
      />
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
                  if (urlNonce === undefined) {
                    const currentUrl = new URL(window.location.href);
                    currentUrl.searchParams.set("nonce", tx.nonce.toString());
                    router.push(currentUrl.pathname + currentUrl.search);
                  }
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
            {isSendPending ? "Executing.." : isSent ? "Executed" : "Execute"}
          </Button>
          <TransactionInfoDialog isConfirmButton={false} canSend={canSend} />
        </div>
      )}
    </div>
  );
}
