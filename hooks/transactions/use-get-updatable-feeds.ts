import { ParsedSignedTx, SignedTx } from "@/core/safe-tx";
import {
  getCallsTouchedUpdatablePriceFeeds,
  ParsedCall,
} from "@gearbox-protocol/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { useDecodeGovernorCalls } from "./use-decode-governor-call";
import { useDecodeInstanceCalls } from "./use-decode-instance-call";

function useGetUpdatableFeeds({
  cid,
  index,
  parsedCalls,
}: {
  cid: string;
  index: number;
  parsedCalls: ParsedCall[];
}) {
  const publicClient = usePublicClient();

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

export function useGetGovernorUpdatableFeeds({
  governor,
  tx,
  ...rest
}: {
  governor: Address;
  tx: ParsedSignedTx;
  cid: string;
  index: number;
}) {
  const parsedCalls = useDecodeGovernorCalls(governor, tx.calls);

  return useGetUpdatableFeeds({
    parsedCalls,
    ...rest,
  });
}

export function useGetInstanceUpdatableFeeds({
  instanceManager,
  tx,
  ...rest
}: {
  instanceManager: Address;
  tx: SignedTx;
  cid: string;
  index: number;
}) {
  const parsedCalls = useDecodeInstanceCalls(instanceManager, tx.calls).filter(
    ({ args }) => args.data.startsWith("addPriceFeed")
  );

  return useGetUpdatableFeeds({
    parsedCalls,
    ...rest,
  });
}
