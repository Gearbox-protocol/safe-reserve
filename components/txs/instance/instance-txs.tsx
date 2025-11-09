"use client";

import { SkeletonStack } from "@/components/ui/skeleton";
import { useCurrentTransactions, useIpfsData, useSafeParams } from "@/hooks";
import { Address } from "viem";
import AddCid from "./add-cid";
import { InstanceTransactionCard } from "./instance-tx-card";

export type TabType = "queue" | "execute" | "history";

export function InstanceTxs({
  cids,
  chainId,
  instanceManager,
  nonce,
  index,
  onSelect,
}: {
  cids: string[];
  chainId: number;
  instanceManager: Address;
  index: number;
  nonce: number;
  onSelect: (cids: string[]) => Promise<void>;
}) {
  const currentTransactions = useCurrentTransactions(cids[index], nonce);

  const {
    type,
    txs,
    safe,
    isLoading: isLoadingTxs,
    error: errorTxs,
  } = currentTransactions;

  const {
    chainId: currentChainId,
    instanceManager: currentInstanceManager,
    isLoading: isLoadingInfo,
    error: errorInfo,
  } = useIpfsData(cids[index]);

  const { threshold } = useSafeParams(chainId, safe);

  if (isLoadingTxs || isLoadingInfo) {
    return <SkeletonStack />;
  }

  if (errorTxs || errorInfo) {
    return (
      <AddCid
        cids={cids}
        index={index}
        onSelect={onSelect}
        msg={`Error in CID #${index}: ${errorTxs?.message || errorInfo?.message}`}
      />
    );
  }

  if (type === "timelock")
    return (
      <AddCid
        cids={cids}
        index={index}
        onSelect={onSelect}
        msg={`Transactions from CID #${index} were build for governor; multiple CIDs with governor transactions are not supported`}
      />
    );

  if (chainId !== currentChainId)
    return (
      <AddCid
        cids={cids}
        index={index}
        onSelect={onSelect}
        msg={`Transactions from CID #${index} were build for different chain`}
      />
    );

  if (instanceManager.toLowerCase() !== currentInstanceManager?.toLowerCase())
    return (
      <AddCid
        cids={cids}
        index={index}
        onSelect={onSelect}
        msg={`Transactions from CID #${index} were build for different instance manager`}
      />
    );

  if (
    cids.findIndex((c) => c.toLowerCase() === cids[index].toLowerCase()) < index
  )
    return (
      <AddCid
        cids={cids}
        index={index}
        onSelect={onSelect}
        msg={`Duplicated CID #${index}`}
      />
    );

  return (
    <>
      <div className="flex flex-col gap-2">
        {txs.map((tx, idx) => (
          <InstanceTransactionCard
            key={`${cids[index]}-${index}-${tx.hash}-${idx}`}
            chainId={chainId}
            cid={cids[index]}
            tx={tx}
            safeAddress={safe!}
            isExecuted={currentTransactions.isExecuted!}
            executedTxHash={currentTransactions.executedTxHash}
            instanceManager={currentTransactions.instanceManager!}
            threshold={threshold || 0}
            index={idx}
          />
        ))}
      </div>

      {index === cids.length - 1 && (
        <div className="pt-6">
          <AddCid cids={cids} index={cids.length} onSelect={onSelect} />
        </div>
      )}
    </>
  );
}
