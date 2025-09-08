import { Call } from "@/core/safe-tx";
import { useDecodeInstanceCall, useGetInstanceCallMeta } from "@/hooks";
import { Addresses, deepJsonParse } from "@gearbox-protocol/permissionless";
import { json_stringify } from "@gearbox-protocol/sdk";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useState } from "react";
import { Address, formatUnits } from "viem";

interface ProposalCallProps {
  instanceManager: Address;
  index: number;
  call: Call;
}

const convertToUsd = (value?: bigint) =>
  value !== undefined
    ? `$${Number(formatUnits(value, 8)).toFixed(2)}`
    : undefined;

export function InstanceProposalCall({
  instanceManager,
  index,
  call,
}: ProposalCallProps) {
  const parsedCall = useDecodeInstanceCall(instanceManager, call);

  const callMeta = useGetInstanceCallMeta(parsedCall);
  const [isExpanded, setIsExpanded] = useState(false);

  const tryPrettyPrint = useCallback(
    (value: unknown) => {
      const parsed = deepJsonParse(value);

      if (typeof parsed === "object" && parsed !== null) {
        const parsedWithMeta = { ...parsed };

        if ("token" in parsedWithMeta && callMeta.token) {
          parsedWithMeta.token = `${parsedWithMeta.token} [${callMeta.symbol ?? "loading..."}]`;
        }
        if ("priceFeed" in parsedWithMeta && callMeta.priceFeed) {
          parsedWithMeta.priceFeed = `${parsedWithMeta.priceFeed} [${callMeta.priceFeedType ?? "unknown"} feed with ${convertToUsd(callMeta.latestRoundData?.[1]) ?? "loading..."} price]`;
        }

        return (
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {json_stringify(parsedWithMeta)}
          </pre>
        );
      } else if (
        typeof value === "string" &&
        typeof parsed === "string" &&
        parsed !== null
      ) {
        // parse string "fname(Object)"
        const match = value.match(/^(\w+)\((\{[\s\S]*\})\)$/);
        if (match) {
          const [, fnName, jsonStr] = match;
          try {
            console.log(jsonStr);

            return (
              <div className="">
                <div>{`${fnName}(`}</div>
                <div className="pl-4">{tryPrettyPrint(jsonStr)}</div>
                <div>{")"}</div>
              </div>
            );
          } catch {}
        }
      }

      if (
        typeof parsed === "string" &&
        parsed.toLowerCase() === Addresses.PRICE_FEED_STORE.toLowerCase()
      ) {
        return `${parsed} [Price Feed Store]`;
      }
      return String(parsed);
    },
    [callMeta]
  );

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
            ? `${parsedCall.functionName} ${
                functionNamePrefix ? `[${functionNamePrefix}]` : ""
              }`
            : "Unknown function"}
        </span>
        {!!callMeta.fnName &&
          (callMeta.isLoading ? (
            <div className={"flex items-center gap-2"}>
              <span className="text-gray-300">{`[${callMeta.fnName}]`}</span>
              <div className="h-4 min-w-[56px] w-[56px] bg-gray-800 rounded  animate-pulse" />
            </div>
          ) : (
            <span className="text-gray-300">
              {`[${callMeta.fnName}${callMeta.priceFeedType ? ` ${callMeta.priceFeedType}` : ""}${callMeta.symbol ? ` for ${callMeta.symbol}` : ""}${callMeta.latestRoundData ? ` with ${convertToUsd(callMeta.latestRoundData[1])} price` : ""}]`}
            </span>
          ))}

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
              className="grid grid-cols-[120px_auto] border-t border-gray-800 p-4 text-sm text-gray-400"
            >
              <div className="font-semibold">{arg}: </div>
              {arg === "data" && callMeta.isLoading ? (
                <div className="h-4 w-1/2 bg-gray-800 rounded  animate-pulse" />
              ) : (
                <div className="">{tryPrettyPrint(value)}</div>
              )}
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
