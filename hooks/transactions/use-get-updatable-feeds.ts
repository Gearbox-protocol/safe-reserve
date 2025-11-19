import { ExtendedSignedTx, ParsedSignedTx } from "@/core/safe-tx";
import { AP_PRICE_FEED_COMPRESSOR } from "@gearbox-protocol/sdk";
import {
  Addresses,
  AddressProviderContract,
  getCallsTouchedUpdatablePriceFeeds,
  getUpdatablePriceFeeds,
  ParsedCall,
} from "@gearbox-protocol/sdk/permissionless";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { useSDK } from "../use-sdk";
import { useDecodeGovernorCalls } from "./use-decode-governor-call";
import { useDecodeInstanceCalls } from "./use-decode-instance-call";

function useGetUpdatableFeeds({
  cid,
  chainId,
  index,
  parsedCalls,
  tx,
}: {
  cid: string;
  chainId: number;
  index: number;
  parsedCalls: ParsedCall[];
  tx: ExtendedSignedTx;
}) {
  const { data: sdk } = useSDK({});
  const publicClient = usePublicClient({ chainId });

  return useQuery({
    queryKey: [cid, index],
    queryFn: async () => {
      if (!publicClient || !sdk) return;
      if (tx.updatableFeeds) {
        const addressProvider = new AddressProviderContract(
          Addresses.ADDRESS_PROVIDER,
          publicClient
        );

        const pfCompressor = await addressProvider.getAddressOrRevert(
          AP_PRICE_FEED_COMPRESSOR,
          310n
        );

        return (
          await getUpdatablePriceFeeds({
            sdk,
            client: publicClient,
            pfCompressor,
            priceFeeds: tx.updatableFeeds,
          })
        ).map((feed) => feed.address);
      }

      return await getCallsTouchedUpdatablePriceFeeds({
        client: publicClient,
        parsedCalls,
      });
    },
    enabled: !!publicClient || !!sdk,
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
    tx,
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
  tx: ExtendedSignedTx;
  cid: string;
  chainId: number;
  index: number;
}) {
  const parsedCalls = useDecodeInstanceCalls(
    chainId,
    instanceManager,
    tx.calls
  ).filter(
    ({ args }) =>
      args?.data?.startsWith("addPriceFeed") ||
      args?.functionName === "addPriceFeed"
  );

  return useGetUpdatableFeeds({
    chainId,
    parsedCalls,
    tx,
    ...rest,
  });
}
