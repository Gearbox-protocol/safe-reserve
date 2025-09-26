"use client";

import { Card } from "@/components/ui/card";
import { PageLayout } from "@/components/ui/page";
import { useCurrentTransactions, useIpfsData, useSafeParams } from "@/hooks";
import { shortenHash } from "@/utils/format";
import { Copy, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAccount, useSwitchChain } from "wagmi";
import { GovernorTransactionCard } from "./governor/governor-tx-card";
import { InstanceTransactionCard } from "./instance/instance-tx-card";

export type TabType = "queue" | "execute" | "history";

export function ViewTxList({ cid }: { cid: string }) {
  const currentTransactions = useCurrentTransactions(cid);

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
  } = useIpfsData(cid);

  const { threshold } = useSafeParams(chainId, safe);

  const { switchChain, chains } = useSwitchChain();
  const { chain, address } = useAccount();

  useEffect(() => {
    if (!!chainId && chainId !== chain?.id) {
      switchChain({ chainId });
    }
  }, [chain?.id, chainId, switchChain]);

  if (errorTxs) {
    return <div>Error: {errorTxs.message}</div>;
  }

  if (errorInfo) {
    return <div>Error: {errorInfo.message}</div>;
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
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={() => {
                          navigator.clipboard.writeText(marketConfigurator);
                          toast.success("Address copied to clipboard");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {chain?.blockExplorers?.default?.url && (
                        <button
                          className="text-gray-400 hover:text-white"
                          onClick={() =>
                            window.open(
                              `${chain?.blockExplorers?.default.url}/address/${marketConfigurator}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
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
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={() => {
                          navigator.clipboard.writeText(instanceManager);
                          toast.success("Address copied to clipboard");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {chain?.blockExplorers?.default?.url && (
                        <button
                          className="text-gray-400 hover:text-white"
                          onClick={() =>
                            window.open(
                              `${chain?.blockExplorers?.default.url}/address/${marketConfigurator}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </code>
                  </div>
                )}
                <div className="flex w-full items-center gap-2">
                  <span className="min-w-[180px] text-gray-300">Safe:</span>
                  <code className="flex items-center gap-2 text-gray-100">
                    {shortenHash(safe!)}
                    <button
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(safe!);
                        toast.success("Address copied to clipboard");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {chain?.blockExplorers?.default?.url && (
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={() =>
                          window.open(
                            `${chain?.blockExplorers?.default.url}/address/${marketConfigurator}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </code>
                </div>
                <div className="flex w-full items-center gap-2">
                  <span className="min-w-[180px] text-gray-300">Author:</span>
                  <code className="flex items-center gap-2 text-gray-100">
                    {shortenHash(author!)}
                    <button
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(author!);
                        toast.success("Address copied to clipboard");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {chain?.blockExplorers?.default?.url && (
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={() =>
                          window.open(
                            `${chain?.blockExplorers?.default.url}/address/${marketConfigurator}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </code>
                </div>
              </div>
            </Card>
            {chainId &&
              (chainId === chain?.id || !address) &&
              (type === "timelock" ? (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] px-1">
                  {txs.map((tx, index) => (
                    <GovernorTransactionCard
                      key={tx.hash}
                      chainId={chainId}
                      cid={cid}
                      tx={tx}
                      safeAddress={safe!}
                      governor={currentTransactions.governor!}
                      threshold={threshold || 0}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] px-1">
                  {txs.map((tx, index) => (
                    <InstanceTransactionCard
                      key={tx.hash}
                      chainId={chainId}
                      cid={cid}
                      tx={tx}
                      safeAddress={safe!}
                      instanceManager={currentTransactions.instanceManager!}
                      threshold={threshold || 0}
                      index={index}
                    />
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
