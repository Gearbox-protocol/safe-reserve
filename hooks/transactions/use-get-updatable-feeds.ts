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
  chainId,
  index,
  parsedCalls,
}: {
  cid: string;
  chainId: number;
  index: number;
  parsedCalls: ParsedCall[];
}) {
  const publicClient = usePublicClient({ chainId });

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
  chainId,
  governor,
  tx,
  ...rest
}: {
  governor: Address;
  tx: ParsedSignedTx;
  cid: string;
  chainId: number;
  index: number;
}) {
  const parsedCalls = useDecodeGovernorCalls(chainId, governor, tx.calls);

  return useGetUpdatableFeeds({
    chainId,
    parsedCalls,
    ...rest,
  });
}

export function useGetInstanceUpdatableFeeds({
  chainId,
  instanceManager,
  tx,
  ...rest
}: {
  instanceManager: Address;
  tx: SignedTx;
  cid: string;
  chainId: number;
  index: number;
}) {
  const parsedCalls = useDecodeInstanceCalls(
    chainId,
    instanceManager,
    tx.calls
  ).filter(({ args }) => args.data.startsWith("addPriceFeed"));

  return useGetUpdatableFeeds({
    chainId,
    parsedCalls,
    ...rest,
  });
}
