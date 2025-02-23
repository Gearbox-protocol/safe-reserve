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
        <span className="text-white">{call.data}</span>
        {isExpanded ? (
          <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* {isExpanded && (
        <div className="border-t border-gray-800 p-4">
          <div className="space-y-3">
            {Object.entries(call.args).map(([key, value], idx) => (
              <div
                key={idx}
                className="grid grid-cols-[140px_1fr] items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">{key}</span>
                  <span className="text-xs text-gray-400">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}
