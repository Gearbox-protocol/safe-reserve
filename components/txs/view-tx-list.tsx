"use client";

import { useCurrentTransactions, useIpfsData, useSafeParams } from "@/hooks";
import { shortenHash } from "@/utils/format";
import {
  Card,
  CopyButton,
  ExternalButton,
  PageLayout,
} from "@gearbox-protocol/permissionless-ui";
import { useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { GovernorTransactionCard } from "./governor/governor-tx-card";
import { InstanceTxList } from "./instance/instance-tx-list";

export type TabType = "queue" | "execute" | "history";

export function ViewTxList({
  cids,
  onSelect,
}: {
  cids: string[];
  onSelect: (cids: string[]) => void;
}) {
  const currentTransactions = useCurrentTransactions(cids[0]);

  const {
    type,
    txs,
    safe,
    isLoading: isLoadingTxs,
    error: errorTxs,
  } = currentTransactions;

  const {
    chainId,
    marketConfigurator,
    instanceManager,
    author,
    isLoading: isLoadingInfo,
    error: errorInfo,
  } = useIpfsData(cids[0]);

  const { threshold } = useSafeParams(chainId, safe);

  const { switchChain, chains } = useSwitchChain();
  const { chain, address } = useAccount();

  useEffect(() => {
    if (!!chainId && chainId !== chain?.id) {
      switchChain({ chainId });
    }
  }, [chain?.id, chainId, switchChain]);

  if (errorTxs || errorInfo) {
    return <div>Error: {errorTxs?.message || errorInfo?.message}</div>;
  }

  return (
    <PageLayout
      title={"Transactions"}
      // TODO: add cancel button
      // actionButton={}
    >
      <div className="space-y-6 overflow-y-auto">
        {isLoadingTxs || isLoadingInfo ? (
          <div className="divide-y divide-gray-800 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-6 w-1/3 bg-gray-800 rounded mb-4" />
                <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
                <div className="h-4 w-1/4 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="p-4">
            <text className="font-semibold text-white">
              Invalid cid: transactions not found
            </text>
          </div>
        ) : (
          <div className="space-y-6 min-w-[620px]">
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex w-full items-center gap-2">
                  <span className="min-w-[180px] text-gray-300">Chain:</span>
                  <code className="flex items-center gap-2 text-gray-100">
                    {chainId !== chain?.id
                      ? chains.map(({ id }) => id).includes(chainId ?? 0)
                        ? chainId
                        : `Unknown chain (${chainId})`
                      : (chain?.name ?? chainId)}
                  </code>
                </div>
                {marketConfigurator && (
                  <div className="flex w-full items-center gap-2">
                    <span className="min-w-[180px] text-gray-300">
                      Market configurator:
                    </span>
                    <code className="flex items-center gap-2 text-gray-100">
                      {shortenHash(marketConfigurator)}
                      <CopyButton text={marketConfigurator} size="3.5" />
                      {chain?.blockExplorers?.default?.url && (
                        <ExternalButton
                          url={`${chain.blockExplorers.default.url}/address/${marketConfigurator}`}
                          size="3.5"
                        />
                      )}
                    </code>
                  </div>
                )}
                {instanceManager && (
                  <div className="flex w-full items-center gap-2">
                    <span className="min-w-[180px] text-gray-300">
                      Instance manager:
                    </span>
                    <code className="flex items-center gap-2 text-gray-100">
                      {shortenHash(instanceManager)}
                      <CopyButton text={instanceManager} size="3.5" />
                      {chain?.blockExplorers?.default?.url && (
                        <ExternalButton
                          url={`${chain.blockExplorers.default.url}/address/${instanceManager}`}
                          size="3.5"
                        />
                      )}
                    </code>
                  </div>
                )}
                <div className="flex w-full items-center gap-2">
                  <span className="min-w-[180px] text-gray-300">Safe:</span>
                  <code className="flex items-center gap-2 text-gray-100">
                    {shortenHash(safe!)}
                    <CopyButton text={safe!} size="3.5" />
                    {chain?.blockExplorers?.default?.url && (
                      <ExternalButton
                        url={`${chain.blockExplorers.default.url}/address/${safe}`}
                        size="3.5"
                      />
                    )}
                  </code>
                </div>
                <div className="flex w-full items-center gap-2">
                  <span className="min-w-[180px] text-gray-300">Author:</span>
                  <code className="flex items-center gap-2 text-gray-100">
                    {shortenHash(author!)}
                    <CopyButton text={author!} size="3.5" />
                    {chain?.blockExplorers?.default?.url && (
                      <ExternalButton
                        url={`${chain.blockExplorers.default.url}/address/${author}`}
                        size="3.5"
                      />
                    )}
                  </code>
                </div>
              </div>
            </Card>
            {chainId &&
              (chainId === chain?.id || !address) &&
              (type === "timelock" ? (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] px-1">
                  {cids.length > 1 && (
                    <div className="text-sm text-gray-500">
                      Note: Multiple CIDs with governor transactions are not
                      supported; showing only the first CID
                    </div>
                  )}
                  {txs.map((tx, index) => (
                    <GovernorTransactionCard
                      key={tx.hash}
                      chainId={chainId}
                      cid={cids[0]}
                      tx={tx}
                      safeAddress={safe!}
                      governor={currentTransactions.governor!}
                      threshold={threshold || 0}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <InstanceTxList
                  cids={cids}
                  onSelect={onSelect}
                  chainId={chainId}
                  instanceManager={currentTransactions.instanceManager!}
                />
              ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
