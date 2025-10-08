"use client";

import { chains } from "@/config/wagmi";
import { SignedTx } from "@/core/safe-tx";
import {
  useIsSafeApp,
  useSafeParams,
  useSendInstanceTx,
  useSignTx,
} from "@/hooks";
import { Button } from "@gearbox-protocol/permissionless-ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Address, Hex, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { TransactionInfoDialog } from "../transaction-info-dialog";

interface ButtonTxProps {
  cid: string;
  chainId: number;
  tx: SignedTx;
  safeAddress: Address;
  instanceManager: Address;
  isExecuted: boolean;
  executedTxHash?: Hex;
}

export function InstanceButtonTx({
  cid,
  chainId,
  tx,
  safeAddress,
  instanceManager,
  isExecuted,
  executedTxHash,
}: ButtonTxProps) {
  const chain = chains.find(({ id }) => id === chainId);
  const [txHash, setTxHash] = useState(executedTxHash);

  const [isSent, setIsSent] = useState(isExecuted);
  const [alreadySigned, setAlreadySigned] = useState(false);

  const { signers, threshold, nonce } = useSafeParams(chainId, safeAddress);
  const { address } = useAccount();

  const { sdk } = useSafeAppsSDK();
  const isSafeApp = useIsSafeApp(safeAddress);

  const { send: sendTx, isPending: isSendPending } = useSendInstanceTx(
    chainId,
    safeAddress,
    instanceManager,
    tx,
    (txHash) => setTxHash(txHash)
  );

  const { sign: signTx, isPending: isSignPending } = useSignTx({
    chainId,
    cid,
    safeAddress,
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
      !isSent &&
      (isSafeApp ||
        ((signers || [])
          .map((addr) => addr.toLowerCase())
          .some((s) => s === address?.toLowerCase()) &&
          !tx.signedBy
            .map((s) => s.toLowerCase())
            .includes(address?.toLowerCase() || zeroAddress)))
    );
  }, [signers, isSent, address, tx.signedBy, alreadySigned, isSafeApp]);

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
        <div className="flex items-center gap-2">
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
          {isSent && txHash && chain?.blockExplorers.default.url && (
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `${chain?.blockExplorers.default.url}/tx/${txHash}`,
                  "_blank"
                )
              }
            >
              View
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {!isSent && (
            <TransactionInfoDialog isConfirmButton={false} canSend={canSend} />
          )}
        </div>
      )}
    </div>
  );
}
