import { RenderAddressText } from "@/components/ui/render-address-text";
import { Call } from "@/core/safe-tx";
import { useDecodeGovernorCall } from "@/hooks";
import { cn } from "@gearbox-protocol/permissionless-ui";
import { json_stringify } from "@gearbox-protocol/sdk";
import { deepJsonParse } from "@gearbox-protocol/sdk/permissionless";
import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";

interface ProposalCallProps {
  chainId: number;
  governor: Address;
  index: number;
  call: Call;
}

export function GovernorProposalCall({
  chainId,
  governor,
  index,
  call,
}: ProposalCallProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { chain } = useAccount();

  const parsedCall = useDecodeGovernorCall(chainId, governor, call);

  const tryPrettyPrint = useCallback(
    (value: unknown) => {
      const parsed = deepJsonParse(value);

      if (typeof parsed === "object" && parsed !== null) {
        return (
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            <RenderAddressText
              text={json_stringify(parsed)}
              blockExplorerUrl={chain?.blockExplorers?.default?.url}
            />
          </pre>
        );
      }

      return (
        <RenderAddressText
          text={String(parsed)}
          blockExplorerUrl={chain?.blockExplorers?.default?.url}
        />
      );
    },
    [chain]
  );

  const isDecoded = !parsedCall.functionName.startsWith("Unknown function");
  const isExpandable = !isDecoded || Object.keys(parsedCall.args).length > 0;
  const functionNamePostfix = parsedCall.args.signature
    ? parsedCall.args.signature.split("(")[0]
    : null;

  return (
    <div className="rounded bg-gray-900/50">
      <div
        className={`flex ${isExpandable ? "cursor-pointer" : ""} items-center gap-2 p-3`}
        onClick={() => {
          if (isExpandable) {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <span className="text-muted-foreground">#{index}</span>
        <span className="text-muted-foreground">
          {isDecoded
            ? `${parsedCall.functionName}${functionNamePostfix ? ":" : ""}`
            : "Unknown function"}
        </span>
        {isDecoded && functionNamePostfix && <span>{functionNamePostfix}</span>}

        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 text-muted-foreground",
            isExpanded ? "rotate-180" : "",
            "transition-transform duration-200 ease-in-out"
          )}
        />
      </div>

      {isExpanded && (
        <div className="border-t border-gray-800 p-4 space-y-2">
          {isDecoded ? (
            Object.entries(parsedCall.args).map(([arg, value], i) => (
              <div
                key={i}
                className="grid grid-cols-[140px_auto] gap-2 items-center"
              >
                <div className="h-full flex items-top text-muted-foreground">
                  {arg}:{" "}
                </div>
                <div className="text-medium text-sm font-mono">
                  {tryPrettyPrint(value)}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-[140px_auto] gap-2 items-center">
              <div className="h-full flex items-top text-muted-foreground">
                calldata:
              </div>
              <div className="text-medium text-sm font-mono break-all">
                {call.data}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
