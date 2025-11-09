"use client";

import { chains } from "@/config/wagmi";
import { ParsedSignedTx } from "@/core/safe-tx";
import { useGetGovernorUpdatableFeeds } from "@/hooks";
import { MULTISEND_ADDRESS } from "@/utils/constant";
import { shortenHash } from "@/utils/format";
import { TimelockTxStatus } from "@/utils/tx-status";
import {
  CopyButton,
  ExpandableCard,
  ExternalButton,
  Skeleton,
} from "@gearbox-protocol/permissionless-ui";
import { useMemo } from "react";
import { Address, zeroAddress } from "viem";
import { SimulateTxButton } from "../simulate-tx-button";
import { TransactionCardProps } from "../types";
import { GovernorProposalCall } from "./governor-proposal-call";
import { GovernorProposalSignatures } from "./governor-proposal-signatures";
import { GovernorButtonTx } from "./governor-tx-button";

interface GovernorTransactionCardProps extends TransactionCardProps {
  tx: ParsedSignedTx;
  governor: Address;
}

export function GovernorTransactionCard({
  cid,
  chainId,
  tx,
  safeAddress,
  governor,
  threshold,
  index,
}: GovernorTransactionCardProps) {
  const chain = chains.find(({ id }) => id === chainId);
  const { data: updatableFeeds, isLoading } = useGetGovernorUpdatableFeeds({
    cid,
    chainId,
    index,
    governor,
    tx,
  });

  const showUpdatableFeeds = useMemo(() => {
    if (
      ![
        TimelockTxStatus.Queued,
        TimelockTxStatus.Executed,
        TimelockTxStatus.Ready,
      ].includes(tx.status)
    )
      return false;

    return isLoading || (updatableFeeds && updatableFeeds.length > 0);
  }, [isLoading, tx.status, updatableFeeds]);

  return (
    <ExpandableCard
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg text-muted-foreground font-mono">
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
            <span className="text-muted-foreground">
              {tx.calls.length} actions
            </span>
            <span className="text-muted-foreground">
              {[TimelockTxStatus.Queued, TimelockTxStatus.Executed].includes(
                tx.status
              )
                ? Number(threshold)
                : tx.signedBy.length}{" "}
              / {Number(threshold)}
            </span>

            {/* Only show simulation button for non-queued and ready transactions */}
            {(tx.status === TimelockTxStatus.NotFound ||
              tx.status === TimelockTxStatus.Ready) && (
              <SimulateTxButton
                chainId={chainId}
                tx={tx}
                safeAddress={safeAddress}
                governor={governor}
                instanceManager={zeroAddress}
                isGovernorTxs={true}
              />
            )}

            <GovernorButtonTx
              chainId={chainId}
              cid={cid}
              tx={tx}
              safeAddress={safeAddress}
              governor={governor}
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
              <GovernorProposalCall
                chainId={chainId}
                governor={governor}
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
          <GovernorProposalSignatures
            chainId={chainId}
            signers={tx.signedBy || []}
            safeAddress={safeAddress}
            status={tx.status}
          />
        </div>
      </div>
    </ExpandableCard>
  );
}
