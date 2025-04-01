import { useSafeParams } from "@/hooks/use-safe-params";
import { shortenHash } from "@/utils/format";
import { Check, Copy, ExternalLink, Plus, X } from "lucide-react";
import { useState } from "react";
import { Address } from "viem";
import { TimelockTxStatus } from "../../utils/tx-status";
import { TabType } from "../../hooks/use-tabs";
import { TABS } from "./view-tx-list";

interface ProposalSignaturesProps {
  safeAddress: Address;
  activeTab: TabType<typeof TABS>;
  signers: Address[];
  status: TimelockTxStatus;
}

function Identicon({ address, size = 32 }: { address: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-gray-700 flex items-center justify-center text-white text-xs"
      style={{ width: size, height: size }}
    >
      {address.slice(2, 4)}
    </div>
  );
}

export function ProposalSignatures({
  safeAddress,
  signers,
  activeTab,
  status,
}: ProposalSignaturesProps) {
  const [showAll, setShowAll] = useState(false);
  const { threshold } = useSafeParams(safeAddress);

  const hasConfirmations = signers.length > 0 || activeTab !== "queue";

  return (
    <div className="relative w-[400px]">
      {/* Vertical Timeline Line */}
      <div className="absolute left-[11px] top-[2px] bottom-[20px] w-[2px] h-[calc(100% - 20px)] bg-gray-800" />

      <div className="space-y-6">
        {/* Created Stage */}
        <div className="relative flex items-center">
          <div className="absolute left-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
            <Plus className="h-3 w-3 text-black" />
          </div>
          <span className="ml-10 text-white">Created</span>
        </div>

        {/* Confirmations Stage */}
        <div className="space-y-4">
          <div className="relative flex items-center">
            <div
              className={`absolute left-[2px] flex h-5 w-5 items-center justify-center rounded-full ${
                hasConfirmations
                  ? "bg-green-500"
                  : "border-2 border-gray-600 bg-transparent"
              }`}
            >
              {hasConfirmations && <Check className="h-3 w-3 text-black" />}
            </div>
            <span className="ml-10 text-white">
              Confirmations (
              {activeTab === "queue" ? signers.length : threshold} of{" "}
              {threshold})
            </span>
          </div>

          {activeTab === "queue" && (
            <div className="space-y-2">
              {signers.length > 0 && (
                <div className="relative flex items-center">
                  <div className="absolute left-[8px] h-2 w-2 rounded-full bg-green-500" />
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="ml-10 text-green-500 hover:underline"
                  >
                    {showAll ? "Hide all" : "Show all"}
                  </button>
                </div>
              )}

              {showAll &&
                signers.map((confirmation, index) => (
                  <div key={index} className="group relative flex items-center">
                    <div className="absolute left-[8px] h-2 w-2 rounded-full bg-green-500" />
                    <div className="ml-10 flex items-center gap-2">
                      <Identicon address={confirmation} size={32} />
                      <span className="text-white">
                        {shortenHash(confirmation)}
                      </span>
                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="text-gray-400 hover:text-white">
                          <Copy className="h-3 w-3" />
                        </button>
                        <button className="text-gray-400 hover:text-white">
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {(activeTab === "execute" || hasConfirmations) && (
          <div className="relative flex items-center">
            <div
              className={`absolute left-[2px] flex h-5 w-5 items-center justify-center rounded-full ${
                activeTab !== "queue"
                  ? "bg-green-500"
                  : "border-2 border-gray-600 bg-transparent"
              }`}
            >
              {activeTab !== "queue" && (
                <Check className="h-3 w-3 text-black" />
              )}
            </div>
            <span className="ml-10 text-white">Queued</span>
          </div>
        )}

        {activeTab !== "queue" && (
          <div className="relative flex items-center">
            <div
              className={`absolute left-[2px] flex h-5 w-5 items-center justify-center rounded-full ${
                status === TimelockTxStatus.Executed
                  ? "bg-green-500"
                  : status === TimelockTxStatus.Stale ||
                      status === TimelockTxStatus.Canceled
                    ? "bg-red-500"
                    : "border-2 border-gray-600 bg-transparent"
              }`}
            >
              {status === TimelockTxStatus.Executed && (
                <Check className="h-3 w-3 text-black" />
              )}
              {(status === TimelockTxStatus.Stale ||
                status === TimelockTxStatus.Canceled) && (
                <X className="h-3 w-3 text-black" />
              )}
            </div>
            <span className="ml-10 text-white">
              {status === TimelockTxStatus.Stale
                ? "Skipped"
                : status === TimelockTxStatus.Canceled
                  ? "Canceled"
                  : " Executed"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
