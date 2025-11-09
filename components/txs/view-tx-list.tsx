"use client";

import { useCurrentTransactions, useIpfsData, useSafeParams } from "@/hooks";
import { shortenHash } from "@/utils/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CopyButton,
  ExternalButton,
  formatTimestamp,
  PageLayout,
} from "@gearbox-protocol/permissionless-ui";
import { useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { SkeletonStacks } from "../ui/skeleton";
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
    createdAt,
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
  const cidChain = chains.find(({ id }) => id === chainId);

  useEffect(() => {
    if (!!chainId && chainId !== chain?.id) {
      switchChain({ chainId });
    }
  }, [chain?.id, chainId, switchChain]);

  if (errorTxs || errorInfo) {
    return (
      <PageLayout title={"Transactions"}>
        <div className="font-semibold text-muted-foreground">
          Error: {errorTxs?.message || errorInfo?.message}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={"Transactions"}
      // TODO: add cancel button
      // actionButton={}
    >
      <div className="space-y-6 overflow-y-auto overflow-x-hidden">
        {isLoadingTxs || isLoadingInfo ? (
          <SkeletonStacks />
        ) : txs.length === 0 ? (
          <div className="p-4">
            <text className="font-semibold text-white">
              Invalid cid: transactions not found
            </text>
          </div>
        ) : (
          <div className="space-y-6 min-w-[620px]">
            <Card variant="transparent" className="mx-1">
              <CardHeader>
                <div>
                  <CardTitle>
                    {type === "timelock" ? "Curator" : "Instance"} transactions
                    on{" "}
                    {cidChain?.name
                      ? cidChain.name
                      : `Unknown chain (${chainId})`}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>Created by {shortenHash(author!)}</span>
                      <CopyButton text={author!} />
                      {cidChain?.blockExplorers?.default?.url && (
                        <ExternalButton
                          url={`${cidChain.blockExplorers.default.url}/address/${author!}`}
                        />
                      )}
                    </div>
                    {createdAt && <span>at {formatTimestamp(createdAt)}</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    name: "Market configurator",
                    value: marketConfigurator,
                  },
                  {
                    name: "Instance manager",
                    value: instanceManager,
                  },
                  {
                    name: "Safe",
                    value: safe,
                  },
                ].map(({ name, value }) =>
                  !!value ? (
                    <div key={name} className="flex w-full items-center gap-2">
                      <span className="min-w-[180px] text-gray-300">
                        {name}:
                      </span>
                      <code className="flex items-center gap-2 font-mono">
                        {shortenHash(value)}
                        <CopyButton text={value} />
                        {cidChain?.blockExplorers?.default?.url && (
                          <ExternalButton
                            url={`${cidChain.blockExplorers.default.url}/address/${value}`}
                          />
                        )}
                      </code>
                    </div>
                  ) : (
                    <></>
                  )
                )}
              </CardContent>
            </Card>

            <div className="overflow-y-auto max-h-[70vh]">
              <div className="px-1">
                {chainId &&
                  (chainId === chain?.id || !address) &&
                  (type === "timelock" ? (
                    <div className="flex flex-col gap-2">
                      {cids.length > 1 && (
                        <div className="text-sm text-muted-foreground">
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
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
