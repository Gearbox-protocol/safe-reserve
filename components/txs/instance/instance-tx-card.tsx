"use client";

import { chains } from "@/config/wagmi";
import { ExtendedSignedTx } from "@/core/safe-tx";
import { useGetInstanceUpdatableFeeds, useSafeParams, useSDK } from "@/hooks";
import { MULTISEND_ADDRESS } from "@/utils/constant";
import { shortenHash } from "@/utils/format";
import {
  CopyButton,
  ExpandableCard,
  ExternalButton,
  Skeleton,
} from "@gearbox-protocol/permissionless-ui";
import { useMemo } from "react";
import { Address, Hex, zeroAddress } from "viem";
import { SimulateTxButton } from "../simulate-tx-button";
import { TransactionCardProps } from "../types";
import { InstanceProposalCall } from "./instance-proposal-call";
import { InstanceProposalSignatures } from "./instance-proposal-signatures";
import { InstanceButtonTx } from "./instance-tx-button";

interface InstanceTransactionCardProps extends TransactionCardProps {
  tx: ExtendedSignedTx;
  isExecuted: boolean;
  executedTxHash?: Hex;
  instanceManager: Address;
}

export function InstanceTransactionCard({
  cid,
  chainId,
  tx,
  safeAddress,
  instanceManager,
  threshold,
  index,
  executedTxHash,
  isExecuted,
}: InstanceTransactionCardProps) {
  useSDK({});
  const { nonce: currentNonce } = useSafeParams(chainId, safeAddress);
  const chain = chains.find(({ id }) => id === chainId);

  const { data: updatableFeeds, isLoading } = useGetInstanceUpdatableFeeds({
    cid,
    chainId,
    index,
    instanceManager,
    tx,
  });

  const showUpdatableFeeds = useMemo(() => {
    return isLoading || (updatableFeeds && updatableFeeds.length > 0);
  }, [isLoading, updatableFeeds]);

  return (
    <ExpandableCard
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg text-gray-400 w-30">
              #{tx.nonce.toString()}
            </span>
            <div className="flex items-center">
              <span className="text-lg text-white">
                {tx.to.toLowerCase() === MULTISEND_ADDRESS.toLowerCase()
                  ? "Multisend"
                  : tx.to}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{tx.calls.length} actions</span>
            <span className="text-gray-400">
              {isExecuted ? Number(threshold) : tx.signedBy.length} /{" "}
              {Number(threshold)}
            </span>

            {/* Only show simulation button for non-executed transactions */}
            {currentNonce !== undefined && tx.nonce >= currentNonce && (
              <SimulateTxButton
                chainId={chainId}
                tx={tx}
                safeAddress={safeAddress}
                governor={zeroAddress}
                instanceManager={instanceManager}
                isGovernorTxs={false}
              />
            )}

            <InstanceButtonTx
              chainId={chainId}
              cid={cid}
              tx={tx}
              safeAddress={safeAddress}
              instanceManager={instanceManager}
              isExecuted={isExecuted}
              executedTxHash={executedTxHash}
            />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-[1fr_minmax(300px,max-content)] gap-12 overflow-x-auto">
        <div className="space-y-2">
          <div className="flex w-full items-center justify-between gap-2">
            <span className="min-w-[140px] text-muted-foreground">Hash:</span>
            <code className="flex items-center gap-2 font-mono">
              {shortenHash(tx.hash)}
              <CopyButton text={tx.hash} name="Hash" />
            </code>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground">Calls:</div>
            {tx.calls.map((call, index) => (
              <InstanceProposalCall
                chainId={chainId}
                instanceManager={instanceManager}
                key={`call-${index}`}
                index={index + 1}
                call={call}
              />
            ))}
          </div>

          {showUpdatableFeeds && (
            <div className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                </>
              ) : (
                <>
                  <div className="text-muted-foreground">
                    Price feeds to be updated before execution (
                    {updatableFeeds?.length}):
                  </div>
                  <div className="rounded-xl bg-gray-900/30">
                    {updatableFeeds?.map((feed, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-[120px_auto] py-1`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-muted-foreground text-sm">
                            {feed}
                          </div>

                          <CopyButton text={feed} />
                          {chain?.blockExplorers.default.url && (
                            <ExternalButton
                              url={`${chain.blockExplorers.default.url}/address/${feed}`}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="border-l pl-8">
          <InstanceProposalSignatures
            chainId={chainId}
            signers={tx.signedBy || []}
            safeAddress={safeAddress}
            isExecuted={isExecuted}
          />
        </div>
      </div>
    </ExpandableCard>
  );
}
