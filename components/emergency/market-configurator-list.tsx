"use client";

import { useGetMarketConfigurators } from "@/hooks";
import { shortenHash } from "@/utils/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageLayout,
  Skeleton,
} from "@gearbox-protocol/permissionless-ui";
import Link from "next/link";
import { Address } from "viem";

export function MarketConfiguratorList({
  onSelect,
}: {
  onSelect: (chainId: number, mc: Address) => void;
}) {
  const queries = useGetMarketConfigurators();

  return (
    <PageLayout
      title={"Market Configurators"}
      description={
        <p className="text-sm text-muted-foreground">
          Select market configurator to manage emergency actions
        </p>
      }
    >
      <div className="flex flex-col gap-4">
        {[...queries]
          .map((query, idx) => ({
            query,
            idx,
            isLoading: query.isPending || query.isLoading,
            chainId:
              (query.data?.[0]?.chain?.id as number | undefined) ??
              Number.MAX_SAFE_INTEGER,
          }))
          .sort((a, b) => {
            if (a.isLoading !== b.isLoading) return a.isLoading ? 1 : -1;
            return (a.chainId || 0) - (b.chainId || 0);
          })
          .map(({ query, idx }) => {
            if (query.isPending || query.isLoading) {
              return (
                <Card key={`skeleton-${idx}`}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              );
            }

            const data = query.data ?? [];

            if (!data || data.length === 0) {
              return null;
            }

            return data.map(({ name, marketConfigurator, chain }) => (
              <Link
                key={`${chain.id}-${marketConfigurator}`}
                href={{
                  pathname: "/emergency",
                  query: {
                    chainId: String(chain.id),
                    mc: marketConfigurator,
                  },
                }}
              >
                <Card
                  className="p-4 cursor-pointer hover:bg-gray-900/50"
                  onClick={() => onSelect(chain.id, marketConfigurator)}
                >
                  <div>
                    <CardTitle className="truncate text-base font-medium">
                      {name || ""}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground break-all">
                      {chain.name} · {shortenHash(marketConfigurator)}
                    </div>
                  </div>
                </Card>
              </Link>
            ));
          })}
      </div>
    </PageLayout>
  );
}
