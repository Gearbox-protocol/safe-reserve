import { Card } from "@/components/ui/card";
import { chains } from "@/config/wagmi";
import { ParsedSignedTx } from "@/core/safe-tx";
import { useGetGovernorUpdatableFeeds } from "@/hooks";
import { MULTISEND_ADDRESS } from "@/utils/constant";
import { shortenHash } from "@/utils/format";
import { TimelockTxStatus } from "@/utils/tx-status";
import { ChevronDown, ChevronUp, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
  const [isExpanded, setIsExpanded] = useState(false);
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
    <Card className="flex flex-col">
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-900/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <span className="text-lg text-gray-400 w-30">
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
          <span className="text-gray-400">{tx.calls.length} actions</span>
          <span className="text-gray-400">
            {tx.signedBy.length} / {Number(threshold)}
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

          <span className="text-gray-400 transform transition-transform">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-gray-800 bg-gray-900/30 p-4 ">
          <div className="grid grid-cols-[1fr_300px] gap-12">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-[140px] text-gray-200">Hash:</span>
                  <code className="flex items-center gap-2 text-gray-100">
                    {shortenHash(tx.hash)}

                    <button
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(tx.hash);
                        toast.success("Address copied to clipboard");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </code>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="mb-4 text-gray-200">Calls:</div>
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
                <div className="mt-6 space-y-2">
                  {isLoading ? (
                    <>
                      <div className="h-6 w-full bg-gray-800 rounded" />
                      <div className="h-4 w-full bg-gray-800 rounded" />
                    </>
                  ) : (
                    <>
                      <div className="mb-4 text-gray-200">
                        Price feeds to be updated before execution (
                        {updatableFeeds?.length}):
                      </div>
                      <div className="rounded-xl bg-gray-900/30">
                        {updatableFeeds?.map((feed, i) => (
                          <div
                            key={i}
                            className={`grid grid-cols-[120px_auto] ${i > 0 ? "border-t" : ""} border-gray-800 p-4 text-sm text-gray-400`}
                          >
                            <code className="flex items-center gap-2">
                              <div>{feed}</div>

                              <button
                                className="text-gray-400 hover:text-white"
                                onClick={() => {
                                  navigator.clipboard.writeText(feed);
                                  toast.success("Address copied to clipboard");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              {chain?.blockExplorers.default.url && (
                                <button
                                  className="text-gray-400 hover:text-white"
                                  onClick={() =>
                                    window.open(
                                      `${chain?.blockExplorers.default.url}/address/${feed}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              )}
                            </code>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="border-l border-gray-800 pl-8">
              <GovernorProposalSignatures
                chainId={chainId}
                signers={tx.signedBy || []}
                safeAddress={safeAddress}
                status={tx.status}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
