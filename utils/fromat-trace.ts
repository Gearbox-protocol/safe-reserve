// modeified from 
// https://github.com/Rubilmax/viem-tracer/blob/main/src/format.ts

import {
  type Abi,
  type AbiFunction,
  type Address,
  type Hex,
  concatHex,
  decodeAbiParameters,
  decodeEventLog,
  decodeFunctionData,
  erc20Abi,
  erc721Abi,
  erc1155Abi,
  erc4626Abi,
  formatEther,
  isAddress,
  isHex,
  multicall3Abi,
  parseAbi,
  size,
  slice,
  zeroHash,
} from "viem";
import type { RpcCallTrace, RpcLogTrace } from "./debug-trace";

// Text formatting utilities with token-based styling (safe alternative)
const formatText = {
  bold: (text: string) => `[BOLD]${text}[/BOLD]`,
  dim: (text: string) => `[DIM]${text}[/DIM]`,
  grey: (text: string) => `[GREY]${text}[/GREY]`,
  red: (text: string) => `[RED]${text}[/RED]`,
  green: (text: string) => `[GREEN]${text}[/GREEN]`,
  yellow: (text: string) => `[YELLOW]${text}[/YELLOW]`,
  cyan: (text: string) => `[CYAN]${text}[/CYAN]`,
  white: (text: string) => `[WHITE]${text}[/WHITE]`,
  magenta: (text: string) => `[MAGENTA]${text}[/MAGENTA]`,
};

export interface TraceFormatConfig {
  /**
   * Whether to trace gas with each call. Defaults to `false`.
   */
  gas?: boolean;
  /**
   * Whether to trace raw step with each call. Defaults to `false`.
   */
  raw?: boolean;
  /**
   * Whether to show full arguments for each call. Defaults to `false`.
   */
  fullArgs?: boolean;
}

export interface SignaturesCache {
  events: Record<Hex, string>;
  functions: Record<Hex, string>;
}

export const getSelector = (input: Hex) => slice(input, 0, 4);

export const getCallTraceUnknownFunctionSelectors = (trace: RpcCallTrace, signatures: SignaturesCache): string => {
  const rest = (trace.calls ?? [])
    .flatMap((subtrace) => getCallTraceUnknownFunctionSelectors(subtrace, signatures))
    .filter(Boolean);

  if (trace.input) {
    const inputSelector = getSelector(trace.input);

    if (!signatures.functions[inputSelector]) rest.push(inputSelector);
  }

  return rest.join(",");
};

export const getCallTraceUnknownEventSelectors = (trace: RpcCallTrace, signatures: SignaturesCache): string => {
  const rest = (trace.calls ?? [])
    .flatMap((subtrace) => getCallTraceUnknownEventSelectors(subtrace, signatures))
    .filter(Boolean);

  if (trace.logs) {
    for (const log of trace.logs) {
      const selector = log.topics[0]!;

      if (!signatures.events[selector]) rest.push(selector);
    }
  }

  return rest.join(",");
};

export const getIndentLevel = (level: number, index = false) =>
  `${"  ".repeat(level - 1)}${index ? formatText.cyan(`${level - 1} ↳ `) : "    "}`;

export const formatAddress = (address: Address) => `${slice(address, 0, 4)}…${slice(address, -2).slice(2)}`;
export const formatHex = (hex: Hex) => {
  if (hex === zeroHash) return "bytes(0)";

  return size(hex) > 8 ? `${slice(hex, 0, 4)}…${slice(hex, -1).slice(2)}` : hex;
};
export const formatInt = (value: bigint | number) => {
  for (let i = 32n; i <= 256n; i++) if (BigInt(value) === 2n ** i - 1n) return `2 ** ${i} - 1`;

  return String(value);
};

export const formatArg = (arg: unknown, level: number, config: Partial<TraceFormatConfig>): string => {
  if (Array.isArray(arg)) {
    const { length } = arg;
    const wrapLines = length > 5 || arg.some((a) => Array.isArray(a));

    const formattedArr = arg
      .map(
        (arg: unknown, i) =>
          `${wrapLines ? `\n${getIndentLevel(level + 1)}` : ""}${formatText.grey(
            formatArg(arg, level + 1, config),
          )}${i !== length - 1 || wrapLines ? "," : ""}`,
      )
      .join(wrapLines ? "" : " ");

    if (!wrapLines) return `[${formattedArr}]`;

    return `[${formattedArr ? `${formattedArr}\n` : ""}${getIndentLevel(level)}]`;
  }

  switch (typeof arg) {
    case "object": {
      if (arg == null) return "";

      const formattedObj = Object.entries(arg)
        .map(([key, value]) => `\n${getIndentLevel(level + 1)}${key}: ${formatText.grey(formatArg(value, level + 1, config))},`)
        .join("");

      return `{${formattedObj ? `${formattedObj}\n` : ""}${getIndentLevel(level)}}`;
    }
    case "string":
      if (config.fullArgs) return formatText.grey(arg);

      return formatText.grey(isAddress(arg, { strict: false }) ? formatAddress(arg) : isHex(arg) ? formatHex(arg) : arg);
    case "bigint":
    case "number":
      if (config.fullArgs) return formatText.grey(String(arg));

      return formatText.grey(formatInt(arg));
    default:
      return formatText.grey(String(arg));
  }
};

export const formatCallSignature = (
  trace: RpcCallTrace,
  config: Partial<TraceFormatConfig>,
  level: number,
  signatures: SignaturesCache,
) => {
  const selector = getSelector(trace.input);

  const signature = signatures.functions[selector];
  if (!signature) return trace.input;

  const { functionName, args } = decodeFunctionData({
    abi: parseAbi(
      [`function ${signature}`] as [string],
    ),
    data: trace.input,
  });

  const value = BigInt(trace.value ?? "0x0");
  const formattedArgs = args?.map((arg: unknown) => formatArg(arg, level, config)).join(", ");

  const error = trace.revertReason || trace.error;
  let returnValue: string = trace.output || error;

  try {
    if (error == null) {
      const functionAbi = (erc20Abi as Abi)
        .concat(erc721Abi)
        .concat(erc1155Abi)
        .concat(erc4626Abi)
        .concat(multicall3Abi)
        .find((abi): abi is AbiFunction => abi.type === "function" && abi.name === functionName);

      if (functionAbi != null) {
        const decodedOutputs = decodeAbiParameters(functionAbi.outputs, trace.output);

        returnValue = decodedOutputs.map((arg: unknown) => formatArg(arg, level, config)).join(", ");
      }
    }
  } catch {}

  return `${formatText.bold(
    (trace.revertReason || trace.error ? formatText.red : formatText.green)(functionName),
  )}${value !== 0n ? formatText.grey(`{ ${formatText.white(formatEther(value))} ETH }`) : ""}${
    config.gas
      ? formatText.grey(
          `[ ${formatText.dim(formatText.magenta(Number(trace.gasUsed).toLocaleString()))} / ${formatText.dim(
            formatText.magenta(Number(trace.gas).toLocaleString()),
          )} ]`,
        )
      : ""
  }(${formattedArgs ?? ""})${returnValue ? (error ? formatText.red : formatText.grey)(` -> ${returnValue}`) : ""}`;
};

export const formatCallLog = (
  log: RpcLogTrace,
  level: number,
  signatures: SignaturesCache,
  config: Partial<TraceFormatConfig>,
) => {
  const selector = log.topics[0]!;

  const signature = signatures.events[selector];
  if (!signature) return concatHex(log.topics);

  const { eventName, args } = decodeEventLog({
    abi: parseAbi(
      [`event ${signature}`] as [string],
    ),
    data: concatHex(log.topics.slice(1).concat(log.data)),
    topics: log.topics,
    strict: false,
  });

  const formattedArgs = args?.map((arg: unknown) => formatArg(arg, level, config)).join(", ");

  return `${getIndentLevel(level + 1, true)}${formatText.yellow("LOG")} ${eventName}(${formattedArgs ?? ""})`;
};

export const formatCallTrace = (
  trace: RpcCallTrace,
  config: Partial<TraceFormatConfig> = {},
  signatures: SignaturesCache = { events: {}, functions: {} },
  level = 1,
): string => {
  const rest = (trace.calls ?? [])
    .map((subtrace) => formatCallTrace(subtrace, config, signatures, level + 1))
    .join("\n");

  const indentLevel = getIndentLevel(level, true);

  return `${
    level === 1 ? `${indentLevel}${formatText.cyan("FROM")} ${formatText.grey(trace.from)}\n` : ""
  }${indentLevel}${formatText.yellow(trace.type)} ${
    trace.from === trace.to ? formatText.grey("self") : `(${formatText.white(trace.to)})`
  }.${formatCallSignature(trace, config, level, signatures)}${trace.logs ? `\n${trace.logs.map((log) => formatCallLog(log, level, signatures, config))}` : ""}
${config.raw ? `${formatText.grey(JSON.stringify(trace))}\n` : ""}${rest}`;
};

export async function formatFullTrace(
  trace: RpcCallTrace,
  config?: Partial<TraceFormatConfig>,
  signatures: SignaturesCache = { events: {}, functions: {} },
) {
  const unknownFunctionSelectors = getCallTraceUnknownFunctionSelectors(trace, signatures);
  const unknownEventSelectors = getCallTraceUnknownEventSelectors(trace, signatures);

  if (unknownFunctionSelectors || unknownEventSelectors) {
    const searchParams = new URLSearchParams({ filter: "false" });
    if (unknownFunctionSelectors) searchParams.append("function", unknownFunctionSelectors);
    if (unknownEventSelectors) searchParams.append("event", unknownEventSelectors);

    const lookupRes = await fetch(`https://api.openchain.xyz/signature-database/v1/lookup?${searchParams.toString()}`);
    const lookup = await lookupRes.json();

    if (lookup.ok) {
      Object.entries<{ name: string; filtered: boolean }[]>(lookup.result.function).map(([sig, results]) => {
        const match = results.find(({ filtered }) => !filtered)?.name;
        if (!match) return;

        signatures.functions[sig as Hex] = match;
      });
      Object.entries<{ name: string; filtered: boolean }[]>(lookup.result.event).map(([sig, results]) => {
        const match = results.find(({ filtered }) => !filtered)?.name;
        if (!match) return;

        signatures.events[sig as Hex] = match;
      });
    } else {
      console.warn(
        `Failed to fetch signatures for unknown selectors: ${unknownFunctionSelectors},${unknownEventSelectors}`,
        lookup.error,
        "\n",
      );
    }
  }

  return formatText.white(formatCallTrace(trace, config, signatures));
}