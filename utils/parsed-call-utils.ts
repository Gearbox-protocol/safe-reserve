import {
  deepJsonParse,
  ParsedCall,
} from "@gearbox-protocol/sdk/permissionless";

export function getPriceFeedFromInstanceParsedCall(parsedCall: ParsedCall) {
  const match = parsedCall.args?.data?.match(/^(\w+)\((\{[\s\S]*\})\)$/);
  if (match) {
    const [, name, jsonStr] = match;
    const fnName = name;
    const parsed = deepJsonParse(jsonStr);
    if (fnName !== "addPriceFeed") {
      return undefined;
    }
    if (typeof parsed === "object" && parsed !== null) {
      if ("priceFeed" in parsed && typeof parsed.priceFeed === "string") {
        return parsed.priceFeed;
      }
    }
  }
  return undefined;
}
