"use client";

import { Card } from "@/components/ui/card";
import { PageLayout } from "@/components/ui/page";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SafeTx } from "@/core/safe-tx";
import { useCurrentTransactions } from "@/hooks/use-current-transactions";
import { useState } from "react";
import { Address } from "viem";
import { TransactionCard } from "./tx-card";
interface SafeViewProps {
  safeAddress: Address;
  executedProposals: SafeTx[];
}

export function SafeView({ safeAddress, executedProposals }: SafeViewProps) {
  const { txs, isLoading, error } = useCurrentTransactions(safeAddress);

  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");

  const filteredTxs = activeTab === "queue" ? txs || [] : executedProposals;

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <PageLayout title={"Transactions"}>
      <Card className="bg-black border-0">
        <div className="p-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "queue" | "history")
            }
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="queue">Queue</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Proposals List */}
        <div className="divide-y divide-gray-800 space-y-6">
          {isLoading && activeTab === "queue" ? (
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
          ) : (
            filteredTxs.map((tx) => (
              <TransactionCard
                key={tx.hash}
                tx={tx}
                isQueue={activeTab === "queue"}
                safeAddress={safeAddress}
              />
            ))
          )}
        </div>
      </Card>
    </PageLayout>
  );
}
