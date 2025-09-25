import { AccessMode } from "@/core/emergency-actions";
import { decodeAbiParameters, hexToString } from "viem";

export function getLossPolicyState({
  addr,
  contractType,
  serializedParams,
}: {
  addr: `0x${string}`;
  version: bigint;
  contractType: `0x${string}`;
  serializedParams: `0x${string}`;
}) {
  const type = hexToString(contractType, {
    size: 32,
  });

  switch (type) {
    case "LOSS_POLICY::ALIASED": {
      const decoded = decodeAbiParameters(
        [
          { name: "accessMode", type: "uint8" },
          { name: "checksEnabled", type: "bool" },
          { name: "tokens", type: "address[]" },
          {
            name: "priceFeedParams",
            type: "tuple[]",
            components: [
              { name: "priceFeed", type: "address" },
              { name: "stalenessPeriod", type: "uint32" },
              { name: "skipCheck", type: "bool" },
              { name: "tokenDecimals", type: "uint8" },
            ],
          },
        ],
        serializedParams
      );

      const [accessModeRaw, checksEnabled] = decoded;

      return {
        lossPolicy: addr,
        type,
        state: {
          accessMode: Number(accessModeRaw) as AccessMode,
          checksEnabled,
        },
      };
    }

    default:
      return {
        lossPolicy: addr,
        type,
        state: undefined,
      };
  }
}
