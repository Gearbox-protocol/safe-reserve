import { Call } from "@/core/safe-tx";
import {
  AddressMap,
  json_stringify,
  simulateWithPriceUpdates,
} from "@gearbox-protocol/sdk";
import { iVersionAbi } from "@gearbox-protocol/sdk/abi/iVersion";
import {
  deepJsonParse,
  InstanceManagerContract,
  ParsedCall,
} from "@gearbox-protocol/sdk/permissionless";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Address,
  erc20Abi,
  hexToString,
  isAddress,
  parseAbi,
  PublicClient,
} from "viem";
import { usePublicClient } from "wagmi";
import { useSDK } from "../use-sdk";

export function useDecodeInstanceCall(
  chainId: number,
  inatsnceManager: Address,
  call: Call
) {
  const publicClient = usePublicClient({ chainId });
  const instanceManagerContract = new InstanceManagerContract(
    inatsnceManager,
    publicClient as PublicClient
  );

  if (call.to.toLowerCase() !== inatsnceManager.toLowerCase()) {
    return {
      chainId,
      target: call.to,
      label: "Unknown contract",
      functionName: `Unknown function: ${call.data}`,
      args: {},
    };
  }
  return instanceManagerContract.parseFunctionData(call.data);
}

export function useGetInstanceCallMeta(
  chainId: number,
  parsedCall: ParsedCall
) {
  const publicClient = usePublicClient({ chainId });

  const [fnName, token, priceFeed, setLimiterCalls] = useMemo(() => {
    let fnName;
    let token;
    let priceFeed;
    let setLimiterCalls;

    try {
      const match = parsedCall.args?.data?.match(/^(\w+)\((\{[\s\S]*\})\)$/);
      if (match) {
        const [, name, jsonStr] = match;
        fnName = name;
        const parsed = deepJsonParse(jsonStr);

        if (typeof parsed === "object" && parsed !== null) {
          if ("token" in parsed && typeof parsed.token === "string") {
            token = parsed.token;
          }
          if ("priceFeed" in parsed && typeof parsed.priceFeed === "string") {
            priceFeed = parsed.priceFeed;
          }

          if (
            parsedCall.args?.data?.startsWith("configurePriceFeeds") &&
            "calls" in parsed &&
            Array.isArray(parsed.calls)
          ) {
            if (
              parsed.calls.every(
                (call) =>
                  call.functionName === "setLimiter" &&
                  "lowerBound" in call.args
              )
            ) {
              setLimiterCalls = parsed.calls.map((call) => ({
                priceFeed: call.target,
                lowerBound: BigInt(Math.floor(call.args.lowerBound * 1e18)),
              })) as { priceFeed: Address; lowerBound: bigint }[];
            }
          }
        }
      }
    } catch {}

    return [
      fnName,
      token && isAddress(token) ? token : undefined,
      priceFeed && isAddress(priceFeed) ? priceFeed : undefined,
      setLimiterCalls,
    ];
  }, [parsedCall]);

  const { data: sdk, isLoading, error } = useSDK({});

  const {
    data: symbol,
    isLoading: isLoadingSymbol,
    error: errorSymbol,
  } = useQuery({
    queryKey: ["symbol", token],
    queryFn: async () => {
      if (!publicClient || !token) return null;

      return await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "symbol",
      });
    },
    enabled: !!publicClient,
    retry: 3,
  });

  const {
    data: priceFeedDeviations,
    isLoading: isLoadingDeviations,
    error: errorDeviations,
  } = useQuery({
    queryKey: ["deviation", json_stringify(setLimiterCalls)],
    queryFn: async () => {
      if (!publicClient || !setLimiterCalls) return null;

      // Get current lower bounds from all price feeds
      const currentLowerBounds = await publicClient.multicall({
        allowFailure: false,
        contracts: setLimiterCalls.map((call) => ({
          abi: parseAbi([
            "function lowerBound() external view returns (uint256)",
          ]),
          address: call.priceFeed,
          functionName: "lowerBound",
        })),
      });

      const values = await publicClient.multicall({
        allowFailure: false,
        contracts: setLimiterCalls.map((call) => ({
          abi: parseAbi([
            "function getLPExchangeRate() external view returns (uint256)",
          ]),
          address: call.priceFeed,
          functionName: "getLPExchangeRate",
        })),
      });

      // Create price feed => deviation mapping
      const priceFeedDeviationMap = new AddressMap<{
        fromValue: number;
        fromBound: number;
      }>();

      setLimiterCalls.forEach((call, index) => {
        const currentLowerBound = currentLowerBounds[index];
        const value = values[index];
        const fromValue =
          Math.floor(
            Number((10_000n * (value - currentLowerBound)) / currentLowerBound)
          ) / 10_000;

        const fromBound =
          Math.floor(
            Number(
              (10_000n * (call.lowerBound - currentLowerBound)) /
                currentLowerBound
            )
          ) / 10_000;

        priceFeedDeviationMap.upsert(call.priceFeed, { fromValue, fromBound });
      });

      return priceFeedDeviationMap;
    },
    enabled: !!publicClient && !!setLimiterCalls,
    retry: 3,
  });

  const {
    data: latestRoundData,
    isLoading: isLoadingLatestRoundData,
    error: errorLatestRoundData,
  } = useQuery({
    queryKey: ["latestRoundData", priceFeed],
    queryFn: async () => {
      if (!publicClient || !priceFeed || !sdk) return null;

      const updateTxs =
        await sdk.priceFeeds.generateExternalPriceFeedsUpdateTxs([priceFeed]);

      const price = await simulateWithPriceUpdates(publicClient, {
        priceUpdates: updateTxs.txs,
        contracts: [
          {
            address: priceFeed,
            abi: [
              {
                inputs: [],
                name: "latestRoundData",
                outputs: [
                  { name: "roundId", type: "uint80" },
                  { name: "answer", type: "int256" },
                  { name: "startedAt", type: "uint256" },
                  { name: "updatedAt", type: "uint256" },
                  { name: "answeredInRound", type: "uint80" },
                ],
                stateMutability: "view",
                type: "function",
              },
            ],
            functionName: "latestRoundData",
            args: [],
          },
        ],
      });

      try {
        const type = await publicClient.readContract({
          address: priceFeed,
          abi: iVersionAbi,
          functionName: "contractType",
        });

        const splittedType = hexToString(type, { size: 32 }).split("::");

        return { price, type: splittedType[splittedType.length - 1] };
      } catch {
        return { price, type: "EXTERNAL" };
      }
    },
    enabled: !!publicClient && (!priceFeed || !!sdk),
    retry: 3,
  });

  return {
    fnName,
    token,
    priceFeed,
    symbol: !!token && !!symbol ? symbol : undefined,
    latestRoundData:
      !!priceFeed && !!latestRoundData ? latestRoundData.price[0] : undefined,
    priceFeedType:
      !!priceFeed && !!latestRoundData ? latestRoundData.type : undefined,
    priceFeedDeviations: priceFeedDeviations || undefined,
    isLoading:
      (!!token && isLoadingSymbol) ||
      (!!priceFeed && isLoadingLatestRoundData) ||
      ((!!token || !!priceFeed) && isLoading) ||
      (!!setLimiterCalls && isLoadingDeviations),
    error: errorSymbol || errorLatestRoundData || error || errorDeviations,
  };
}

export function useDecodeInstanceCalls(
  chainId: number,
  inatsnceManager: Address,
  calls: Call[]
) {
  const publicClient = usePublicClient({ chainId });
  const instanceManagerContract = new InstanceManagerContract(
    inatsnceManager,
    publicClient as PublicClient
  );

  return calls.map((call) => {
    if (call.to.toLowerCase() !== inatsnceManager.toLowerCase()) {
      return {
        chainId,
        target: call.to,
        label: "Unknown contract",
        functionName: `Unknown function: ${call.data}`,
        args: {},
      };
    }
    return instanceManagerContract.parseFunctionData(call.data);
  });
}
