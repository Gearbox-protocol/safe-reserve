import { Button } from "@/components/ui/button";
import { SignedTx } from "@/core/safe-tx";
import {
  useIsSafeApp,
  useSafeParams,
  useSendInstanceTx,
  useSignTx,
} from "@/hooks";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useMemo, useState } from "react";
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { TransactionInfoDialog } from "../transaction-info-dialog";

interface ButtonTxProps {
  tx: SignedTx;
  safeAddress: Address;
  instanceManager: Address;
  cid: string;
}

export function InstanceButtonTx({
  tx,
  safeAddress,
  instanceManager,
  cid,
}: ButtonTxProps) {
  const [isSent, setIsSent] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);

  const { signers, threshold, nonce } = useSafeParams(safeAddress);
  const { address } = useAccount();

  const { sdk } = useSafeAppsSDK();
  const isSafeApp = useIsSafeApp(safeAddress);

  const { send: sendTx, isPending: isSendPending } = useSendInstanceTx(
    safeAddress,
    instanceManager,
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
    return isSafeApp || (!isSendPending && !canSend);
  }, [isSafeApp, isSendPending, canSend]);

  const isSendButton = useMemo(() => {
    return !isSafeApp && (canSend || (!isSignPending && canSignaAndSend));
  }, [isSafeApp, canSend, isSignPending, canSignaAndSend]);

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
            {isSendPending ? "Executing.." : isSent ? "Executed" : "Execute"}
          </Button>
          <TransactionInfoDialog isConfirmButton={false} canSend={canSend} />
        </div>
      )}
    </div>
  );
}
