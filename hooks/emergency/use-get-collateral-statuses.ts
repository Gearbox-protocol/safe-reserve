import { CreditSuite } from "@gearbox-protocol/sdk";
import {
  iCreditFacadeV310Abi,
  iCreditManagerV310Abi,
} from "@gearbox-protocol/sdk/abi";
import { useQuery } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";

export function useGetCollateralStatuses({
  chainId,
  creditSuite,
}: {
  chainId: number;
  creditSuite: CreditSuite;
}) {
  const config = useConfig();

  return useQuery({
    queryKey: [
      "collateral-tokens",
      chainId,
      creditSuite.creditManager.address.toLowerCase(),
    ],
    queryFn: async () => {
      const publicClient = getPublicClient(config, { chainId });
      if (!publicClient) return [];

      const forbiddenMask = await publicClient.readContract({
        address: creditSuite.creditFacade.address,
        abi: iCreditFacadeV310Abi,
        functionName: "forbiddenTokenMask",
      });

      const bits = await publicClient.multicall({
        allowFailure: false,
        contracts: creditSuite.creditManager.collateralTokens.map((token) => ({
          address: creditSuite.creditManager.address,
          abi: iCreditManagerV310Abi,
          functionName: "getTokenMaskOrRevert" as const,
          args: [token] as const,
        })),
      });

      return creditSuite.creditManager.collateralTokens.map((token, index) => ({
        address: token,
        symbol: creditSuite.sdk.tokensMeta.symbol(token),
        forbidden: (forbiddenMask & bits[index]) !== 0n,
      }));
    },
    retry: 3,
  });
}
