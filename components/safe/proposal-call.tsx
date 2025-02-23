import { Call } from "@/core/safe-tx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ProposalCallProps {
  index: number;
  call: Call;
}

export function ProposalCall({ index, call }: ProposalCallProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded bg-gray-900/30">
      <div
        className="flex cursor-pointer items-center gap-2 p-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-gray-400">#{index}</span>
        <span className="text-gray-400">{call.to} :</span>

        {isExpanded ? (
          <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-800 p-4">
          <div className="overflow-x-auto">
            <code className="text-white break-all whitespace-pre-wrap">
              {call.data}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
