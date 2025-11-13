"use client";

import { chains } from "@/config/wagmi";
import { ExtendedSignedTx } from "@/core/safe-tx";
import {
  useIsSafeApp,
  useSafeParams,
  useSendInstanceTx,
  useSignTx,
} from "@/hooks";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@gearbox-protocol/permissionless-ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Address, Hex, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { TransactionInfoDialog } from "../transaction-info-dialog";

interface ButtonTxProps {
  cid: string;
  chainId: number;
  tx: ExtendedSignedTx;
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

  if (isSent) {
    const explorer = chain?.blockExplorers?.default?.url;
    return (
      <>
        <span className="flex items-center text-white gap-1">
          <span className="text-2xl">•</span>
          <span className="text-white">Executed</span>
        </span>

        {isSent && txHash && explorer && (
          <div className="mx-[-12px]" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  `${explorer}${explorer.endsWith("/") ? "" : "/"}tx/${txHash}`,
                  "_blank"
                );
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}
      </>
    );
  }

  if (
    tx.signedBy
      .map((s) => s.toLowerCase())
      .includes(address?.toLowerCase() || "") &&
    !canSignaAndSend &&
    !canSend
  ) {
    return (
      <span className="flex items-center text-white gap-1">
        <span className="text-2xl">•</span>
        <span className="text-white">Signed</span>
      </span>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="sm"
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
              disabled={!canSign || canSend || isSignPending}
              className={
                "px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 min-w-[100px]"
              }
            >
              {isSignPending ? "Signing..." : "Confirm"}
            </Button>
          </TooltipTrigger>
          {!canSign && !isSignPending && (
            <TooltipContent>
              <p>You are not the signer</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="sm"
              onClick={async (e) => {
                if (!isSendPending) {
                  e.stopPropagation();
                  const isTxSent = await sendTx();
                  setIsSent(!!isTxSent);
                }
              }}
              disabled={
                !isNonceReady || !(canSend || canSignaAndSend) || isSendPending
              }
              className="px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 min-w-[100px]"
            >
              {isSendPending ? "Executing.." : "Execute"}
            </Button>
          </TooltipTrigger>
          {(!isNonceReady || !(canSend || canSignaAndSend)) &&
            !isSendPending && (
              <TooltipContent>
                <p>
                  {!isNonceReady
                    ? "Execute previous tx first"
                    : "Not enough signatures"}
                </p>
              </TooltipContent>
            )}
        </Tooltip>
      </TooltipProvider>

      <TransactionInfoDialog
        isConfirmButton={!(canSend || canSignaAndSend)}
        canSend={canSend}
      />
    </>
  );
}
