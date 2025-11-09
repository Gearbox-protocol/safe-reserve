"use client";

import { useGetMarketConfigurators } from "@/hooks";
import { shortenHash } from "@/utils/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  PageLayout,
  SearchBar,
  Skeleton,
} from "@gearbox-protocol/permissionless-ui";
import Link from "next/link";
import { useState } from "react";
import { Address } from "viem";

export function MarketConfiguratorList({
  onSelect,
}: {
  onSelect: (chainId: number, mc: Address) => void;
}) {
  const queries = useGetMarketConfigurators();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <PageLayout
      title={"Market Configurators"}
      description={
        <p className="text-sm text-muted-foreground">
          Select market configurator to manage emergency actions
        </p>
      }
    >
      <div className="mb-4">
        <SearchBar
          onChange={setSearchQuery}
          placeholder="Search market configurator"
        />
      </div>

      <div className="flex flex-col gap-2">
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
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-2/3" />
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

            return data.map(({ name, marketConfigurator, chain }) => {
              if (searchQuery) {
                if (
                  !name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                  marketConfigurator.toLowerCase() !==
                    searchQuery.toLowerCase() &&
                  !chain.name.toLowerCase().includes(searchQuery.toLowerCase())
                ) {
                  return null;
                }
              }
              return (
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
                    variant="interactive"
                    onClick={() => onSelect(chain.id, marketConfigurator)}
                  >
                    <CardContent>
                      <CardTitle className="truncate text-base font-medium">
                        {name || ""}
                      </CardTitle>
                      <CardDescription className="break-all">
                        {chain.name} · {shortenHash(marketConfigurator)}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            });
          })}
      </div>
    </PageLayout>
  );
}
