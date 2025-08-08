import { ParsedSignedTx } from "@/core/safe-tx";
import { getCallsTouchedUpdatablePriceFeeds } from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { useDecodeGovernorCalls } from "./use-decode-governor-call";

export function useGetUpdatableFeeds({
  cid,
  index,
  governor,
  tx,
}: {
  governor: Address;
  tx: ParsedSignedTx;
  cid: string;
  index: number;
}) {
  const publicClient = usePublicClient();

  const parsedCalls = useDecodeGovernorCalls(governor, tx.calls);

  return useQuery({
    queryKey: [cid, index],
    queryFn: async () => {
      if (!publicClient) return;

      return await getCallsTouchedUpdatablePriceFeeds({
        client: publicClient,
        parsedCalls,
      });
    },
    enabled: !!publicClient,
    retry: 3,
  });
}
