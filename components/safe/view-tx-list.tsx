"use client";

import { Card } from "@/components/ui/card";
import { PageLayout } from "@/components/ui/page";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SafeTx } from "@/core/safe-tx";
import { useCurrentTransactions } from "@/hooks/use-current-transactions";
import { useSafeParams } from "@/hooks/use-safe-params";
import { useMemo, useState } from "react";
import { Address } from "viem";
import { getReportRef } from "../../utils/get-report";
import { TimelockTxStatus } from "../../utils/tx-status";
import { Button } from "../ui/button";
import { TransactionCard } from "./tx-card";

interface SafeViewProps {
  safeAddress: Address;
  executedProposals: SafeTx[];
}

export type TabType = "queue" | "execute" | "history";

export function SafeView({ safeAddress }: SafeViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("queue");

  const { txs, governor, isLoading, error } =
    useCurrentTransactions(safeAddress);
  const { threshold, nonce } = useSafeParams(safeAddress);

  const txsToShow = useMemo(() => {
    return (txs || []).filter((t) => {
      if (activeTab === "queue") {
        return t.nonce >= (nonce ?? 0n);
      } else if (activeTab === "execute") {
        return (
          t.nonce < (nonce ?? 0n) &&
          [TimelockTxStatus.Ready, TimelockTxStatus.Queued].includes(t.status)
        );
      } else if (activeTab === "history") {
        return (
          t.nonce < (nonce ?? 0n) &&
          ![TimelockTxStatus.Queued, TimelockTxStatus.Ready].includes(t.status)
        );
      }
    });
  }, [txs, activeTab, nonce]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <PageLayout
      title={"Transactions"}
      actionButton={
        activeTab === "execute" && governor && txsToShow.length > 0 ? (
          <a
            href={getReportRef({
              network: "Mainnet",
              governor,
              fromBlock: txsToShow[0].queueBlock,
              toBlock: txsToShow[txsToShow.length - 1].queueBlock,
            })}
            target="_blank"
          >
            <Button
              variant="outline"
              className="px-6 bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10 min-w-[100px]"
            >
              {"View Report"}
            </Button>
          </a>
        ) : (
          <></>
        )
      }
    >
      <Card className="bg-black border-0 overflow-y-auto">
        <div className="p-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="queue">New Txs</TabsTrigger>
              <TabsTrigger value="execute">Queued Txs</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="divide-y divide-gray-800 space-y-6 overflow-y-auto">
          {isLoading ? (
            // Skeleton loading state
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-6 w-1/3 bg-gray-800 rounded mb-4" />
                  <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
                  <div className="h-4 w-1/4 bg-gray-800 rounded" />
                </div>
              ))}
            </>
          ) : txsToShow.length === 0 ? (
            <div className="p-4">
              <text className="font-semibold text-white">
                {activeTab === "queue"
                  ? "There is no new transactions to queue"
                  : activeTab === "execute"
                    ? "There is no new transactions to execute"
                    : "There is no transactions"}
              </text>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] px-1">
              {txsToShow.map((tx) => (
                <TransactionCard
                  key={tx.hash}
                  tx={tx}
                  activeTab={activeTab}
                  safeAddress={safeAddress}
                  threshold={threshold || 0}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </PageLayout>
  );
}
