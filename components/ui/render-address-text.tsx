import {
  CopyButton,
  ExternalButton,
} from "@gearbox-protocol/permissionless-ui";
import { useMemo } from "react";
import { Address, isAddress } from "viem";

interface RenderAddressTextProps {
  text: string;
  blockExplorerUrl?: string;
}

export function RenderAddressText({
  text,
  blockExplorerUrl,
}: RenderAddressTextProps) {
  const result = useMemo(() => {
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    const matches = Array.from(text.matchAll(addressRegex));

    if (matches.length === 0) {
      return text;
    }

    const parts = matches.reduce<{
      parts: (string | JSX.Element)[];
      lastIndex: number;
    }>(
      (acc, match, matchIndex) => {
        const currentIndex = match.index ?? 0;
        const previousMatch = matchIndex > 0 ? matches[matchIndex - 1] : null;
        const previousEnd = previousMatch
          ? (previousMatch.index ?? 0) + previousMatch[0].length
          : 0;

        const textBefore =
          currentIndex > previousEnd
            ? [text.slice(previousEnd, currentIndex)]
            : [];

        const address = match[0] as Address;
        const addressElement = isAddress(address) ? (
          <span
            key={currentIndex}
            className="inline-flex items-center align-middle gap-2"
            style={{ whiteSpace: "nowrap" }}
          >
            {address}
            <div className="flex gap-1">
              <CopyButton text={address} className="text-gray-400" />
              {blockExplorerUrl && (
                <ExternalButton
                  className="text-gray-400"
                  url={`${blockExplorerUrl}/address/${address}`}
                />
              )}
            </div>
          </span>
        ) : (
          address
        );

        return {
          parts: [...acc.parts, ...textBefore, addressElement],
          lastIndex: currentIndex + match[0].length,
        };
      },
      { parts: [], lastIndex: 0 }
    );

    return parts.lastIndex < text.length
      ? [...parts.parts, text.slice(parts.lastIndex)]
      : parts.parts;
  }, [text, blockExplorerUrl]);

  if (typeof result === "string") {
    return result;
  }

  return <>{result}</>;
}
