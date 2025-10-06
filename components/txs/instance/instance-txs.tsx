"use client";

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
    return (
      <div className="animate-pulse">
        <div className="h-6 w-1/3 bg-gray-800 rounded mb-4" />
        <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
        <div className="h-4 w-1/4 bg-gray-800 rounded" />
      </div>
    );
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
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] px-1">
        {txs.map((tx, idx) => (
          <InstanceTransactionCard
            key={`${cids[index]}-${index}-${tx.hash}-${idx}`}
            chainId={chainId}
            cid={cids[index]}
            tx={tx}
            safeAddress={safe!}
            isExecuted={currentTransactions.isExecuted!}
            instanceManager={currentTransactions.instanceManager!}
            threshold={threshold || 0}
            index={idx}
          />
        ))}
      </div>

      {index === cids.length - 1 && (
        <div className="pt-4">
          <AddCid cids={cids} index={cids.length} onSelect={onSelect} />
        </div>
      )}
    </>
  );
}
