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
        <span className="text-gray-400">
          {call.parsedFunctionName ?? call.functionName}
        </span>

        {isExpanded ? (
          <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
        )}
      </div>

      {isExpanded &&
        (call.parsedFunctionArgs.length > 0
          ? call.parsedFunctionArgs
          : call.functionArgs
        ).map((arg, i) => (
          <div
            key={i}
            className="border-t border-gray-800 p-4 text-sm text-gray-400"
          >
            {arg as string}
          </div>
        ))}
    </div>
  );
}
