import { Call } from "@/core/safe-tx";
import { useDecodeGovernorCall } from "@/hooks";
import { deepJsonParse } from "@gearbox-protocol/permissionless";
import { json_stringify } from "@gearbox-protocol/sdk";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Address } from "viem";

interface ProposalCallProps {
  chainId: number;
  governor: Address;
  index: number;
  call: Call;
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

export function GovernorProposalCall({
  chainId,
  governor,
  index,
  call,
}: ProposalCallProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parsedCall = useDecodeGovernorCall(chainId, governor, call);

  const isDecoded = !parsedCall.functionName.startsWith("Unknown function");
  const isExpandable = !isDecoded || Object.keys(parsedCall.args).length > 0;
  const functionNamePrefix = parsedCall.args.signature
    ? parsedCall.args.signature.split("(")[0]
    : null;

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
        <span className="text-gray-300">#{index}</span>
        <span className="text-gray-300">
          {isDecoded
            ? `${parsedCall.functionName} ${functionNamePrefix ? `[${functionNamePrefix}]` : ""}`
            : "Unknown function"}
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
              className="grid grid-cols-[120px_auto] border-t border-gray-800 p-4 text-sm text-gray-400 font-mono"
            >
              <div className="font-semibold">{arg}: </div>
              <div>{tryPrettyPrint(value)}</div>
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
