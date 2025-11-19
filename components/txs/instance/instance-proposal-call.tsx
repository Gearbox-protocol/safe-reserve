import { RenderAddressText } from "@/components/ui/render-address-text";
import { Call } from "@/core/safe-tx";
import { useDecodeInstanceCall, useGetInstanceCallMeta } from "@/hooks";
import { ExpandablCall, Skeleton } from "@gearbox-protocol/permissionless-ui";
import { json_stringify } from "@gearbox-protocol/sdk";
import { Addresses, deepJsonParse } from "@gearbox-protocol/sdk/permissionless";
import { useCallback } from "react";
import { Address, formatUnits } from "viem";
import { useAccount } from "wagmi";

interface ProposalCallProps {
  chainId: number;
  instanceManager: Address;
  index: number;
  call: Call;
}

const convertToUsd = (value?: bigint) =>
  value !== undefined
    ? `$${Number(formatUnits(value, 8)).toFixed(2)}`
    : undefined;

export function InstanceProposalCall({
  chainId,
  instanceManager,
  index,
  call,
}: ProposalCallProps) {
  const parsedCall = useDecodeInstanceCall(chainId, instanceManager, call);

  const callMeta = useGetInstanceCallMeta(chainId, parsedCall);
  const { chain } = useAccount();

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

        if (
          callMeta.priceFeedDeviations !== undefined &&
          (parsedCall.args?.data?.startsWith("configurePriceFeeds") ||
            parsedCall.args?.functionName === "configurePriceFeeds") &&
          "calls" in parsedWithMeta &&
          Array.isArray(parsedWithMeta.calls)
        ) {
          if (
            parsedWithMeta.calls.every(
              (call) =>
                call.functionName === "setLimiter" && "lowerBound" in call.args
            )
          ) {
            parsedWithMeta.calls = parsedWithMeta.calls.map((call) => {
              const deviation = callMeta.priceFeedDeviations?.get(call.target);

              if (deviation !== undefined) {
                return {
                  ...call,
                  args: {
                    ...call.args,
                    lowerBound: `${call.args.lowerBound} [${(deviation.fromValue * 100).toFixed(2)}% deviation from value, ${(deviation.fromBound * 100).toFixed(2)}% deviation from current bound]`,
                  },
                };
              }
              return call;
            });
          }
        }

        return (
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            <RenderAddressText
              text={json_stringify(parsedWithMeta)}
              blockExplorerUrl={chain?.blockExplorers?.default?.url}
            />
          </pre>
        );
      } else if (
        typeof value === "string" &&
        typeof parsed === "string" &&
        parsed !== null
      ) {
        const match = value.match(/^(\w+)\((\{[\s\S]*\})\)$/);
        if (match) {
          const [, fnName, jsonStr] = match;
          try {
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
        return (
          <RenderAddressText
            text={`${parsed} [Price Feed Store]`}
            blockExplorerUrl={chain?.blockExplorers?.default?.url}
          />
        );
      }

      return (
        <RenderAddressText
          text={String(parsed)}
          blockExplorerUrl={chain?.blockExplorers?.default?.url}
        />
      );
    },
    [callMeta, parsedCall, chain]
  );

  const isDecoded = !parsedCall.functionName.startsWith("Unknown function");
  const isExpandable = !isDecoded || Object.keys(parsedCall.args).length > 0;
  const functionNamePostfix = parsedCall.args?.signature
    ? parsedCall.args.signature.split("(")[0]
    : (parsedCall.args?.functionName ?? null);

  return (
    <ExpandablCall
      index={index}
      isExpandable={isExpandable}
      header={
        <>
          <span className="text-muted-foreground">
            {isDecoded
              ? `${parsedCall.functionName}${functionNamePostfix || callMeta.fnName ? ":" : ""}`
              : "Unknown function"}
          </span>
          {isDecoded && (functionNamePostfix || !!callMeta.fnName) && (
            <span>{functionNamePostfix || callMeta.fnName}</span>
          )}

          {!!callMeta.fnName &&
            (!!callMeta.priceFeedType ||
              !!callMeta.symbol ||
              !!callMeta.latestRoundData) &&
            (callMeta.isLoading ? (
              <Skeleton className="h-4 min-w-[56px] w-[56px]" />
            ) : (
              <span className="text-muted-foreground font-mono">
                {`[${callMeta.priceFeedType ? callMeta.priceFeedType : ""}${callMeta.symbol ? ` for ${callMeta.symbol}` : ""}${callMeta.latestRoundData ? ` with ${convertToUsd(callMeta.latestRoundData[1])} price` : ""}]`}
              </span>
            ))}
        </>
      }
    >
      {isDecoded ? (
        Object.entries(parsedCall.args).map(([arg, value], i) => (
          <div
            key={i}
            className="grid grid-cols-[140px_auto] gap-2 items-center"
          >
            <div className="h-full flex items-top text-muted-foreground">
              {arg}:{" "}
            </div>
            {arg === "data" && callMeta.isLoading ? (
              <Skeleton className="h-4 w-1/2" />
            ) : (
              <div className="text-medium text-sm font-mono break-all">
                {tryPrettyPrint(value)}
              </div>
            )}
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
    </ExpandablCall>
  );
}
