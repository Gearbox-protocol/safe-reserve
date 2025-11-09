"use client";

import { SkeletonStacks } from "@/components/ui/skeleton";
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
    return <SkeletonStacks />;
  }

  return (
    <div className="divide-y space-y-2">
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
