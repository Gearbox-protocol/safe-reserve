"use client";

import { useInstanceTransactionNonces } from "@/hooks/transactions/use-instance-transactions-nonces";
import { Address } from "viem";
import { InstanceTxs } from "./instance-txs";

export type TabType = "queue" | "execute" | "history";

export function InstanceTxList({
  cids,
  chainId,
  instanceManager,
  onSelect,
}: {
  cids: string[];
  chainId: number;
  instanceManager: Address;
  onSelect: (cids: string[]) => void;
}) {
  const { nonces, isLoading, error, refetch } = useInstanceTransactionNonces({
    cids,
    chainId,
    instanceManager,
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading) {
    return (
      <div className="divide-y divide-gray-800 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="h-6 w-1/3 bg-gray-800 rounded mb-4" />
            <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
            <div className="h-4 w-1/4 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-800 space-y-2">
      {cids.map((cid, index) => (
        <div
          key={`${cid}-${nonces![index]}-${index}`}
          className={index > 0 ? "pt-2" : undefined}
        >
          <InstanceTxs
            cids={cids}
            chainId={chainId}
            instanceManager={instanceManager}
            nonce={nonces![index]}
            index={index}
            onSelect={async (cids) => {
              onSelect(cids);
              await refetch();
            }}
          />
        </div>
      ))}
    </div>
  );
}
