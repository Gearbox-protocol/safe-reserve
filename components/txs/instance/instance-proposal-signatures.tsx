import { chains } from "@/config/wagmi";
import { useSafeParams } from "@/hooks";
import { shortenHash } from "@/utils/format";
import {
  CopyButton,
  ExternalButton,
} from "@gearbox-protocol/permissionless-ui";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Address } from "viem";
import { Identicon } from "../identicon";

interface ProposalSignaturesProps {
  chainId: number;
  safeAddress: Address;
  signers: Address[];
  nonce?: number;
  isExecuted: boolean;
}

export function InstanceProposalSignatures({
  chainId,
  safeAddress,
  signers,
  nonce,
  isExecuted,
}: ProposalSignaturesProps) {
  const chain = chains.find(({ id }) => id === chainId);
  const [showAll, setShowAll] = useState(false);
  const { threshold } = useSafeParams(chainId, safeAddress);

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
          <span className="ml-10 text-white">
            Created {nonce ? `(nonce: ${nonce})` : ""}
          </span>
        </div>

        {/* Queue confirmations Stage */}
        <div className="space-y-4">
          <div className="relative flex items-center">
            <div
              className={`absolute left-[2px] flex h-5 w-5 items-center justify-center rounded-full ${
                signers.length > 0
                  ? "bg-green-500"
                  : "border-2 border-gray-600 bg-transparent"
              }`}
            >
              {signers.length > 0 && <Check className="h-3 w-3 text-black" />}
            </div>
            <span className="ml-10 text-white">
              Confirmations ({signers.length} of {threshold})
            </span>
          </div>

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
                      <CopyButton text={confirmation} />
                      {chain?.blockExplorers.default.url && (
                        <ExternalButton
                          url={`${chain.blockExplorers.default.url}/address/${confirmation}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {signers.length > 0 && (
          <div className="relative flex items-center">
            <div
              className={`absolute left-[2px] flex h-5 w-5 items-center justify-center rounded-full ${
                isExecuted
                  ? "bg-green-500"
                  : "border-2 border-gray-600 bg-transparent"
              }`}
            >
              {isExecuted && <Check className="h-3 w-3 text-black" />}
            </div>
            <span className="ml-10 text-white">Executed</span>
          </div>
        )}
      </div>
    </div>
  );
}
