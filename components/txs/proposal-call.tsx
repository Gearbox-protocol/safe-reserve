import { Call } from "@/core/safe-tx";
import { json_parse, json_stringify } from "@gearbox-protocol/sdk";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Address } from "viem";
import { useDecodeGovernorCall } from "../../hooks/use-decode-governor-call";

interface ProposalCallProps {
  governor: Address;
  index: number;
  call: Call;
}

function deepJsonParse(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      const parsed = json_parse(value);
      if (parsed === value) return value;
      return deepJsonParse(parsed);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) {
    return value.map(deepJsonParse);
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = deepJsonParse(v);
    }
    return result;
  }
  return value;
}

function tryPrettyPrint(value: unknown): React.ReactNode {
  const parsed = deepJsonParse(value);

  if (typeof parsed === "object" && parsed !== null) {
    return (
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {json_stringify(parsed)}
      </pre>
    );
  }
  return String(parsed);
}

export function ProposalCall({ governor, index, call }: ProposalCallProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const parsedCall = useDecodeGovernorCall(governor, call);

  const isDecoded = !parsedCall.functionName.startsWith("Unknown function");
  const isExpandable = !isDecoded || Object.keys(parsedCall.args).length > 0;

  return (
    <div className="rounded bg-gray-900/30">
      <div
        className={`flex ${isExpandable ? "cursor-pointer" : ""} items-center gap-2 p-3`}
        onClick={() => {
          if (isExpandable) {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <span className="text-gray-400">#{index}</span>
        <span className="text-gray-400">
          {isDecoded ? parsedCall.functionName : "Unknown function"}
        </span>

        {isExpandable &&
          (isExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
          ))}
      </div>

      {isExpanded &&
        (isDecoded ? (
          Object.entries(parsedCall.args).map(([arg, value], i) => (
            <div
              key={i}
              className="border-t border-gray-800 p-4 text-sm text-gray-400"
            >
              {arg}: {tryPrettyPrint(value)}
            </div>
          ))
        ) : (
          <div className="border-t border-gray-800 p-4 text-sm text-gray-400">
            calldata: {call.data}
          </div>
        ))}
    </div>
  );
}
