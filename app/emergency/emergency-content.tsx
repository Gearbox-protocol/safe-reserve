"use client";

import { MarketConfiguratorList } from "@/components/emergency/market-configurator-list";
import { MarketConfiguratorView } from "@/components/emergency/market-configurator-view";
import { SkeletonStacks } from "@/components/ui/skeleton";
import { chains } from "@/config/wagmi";
import { Container, PageLayout } from "@gearbox-protocol/permissionless-ui";
import { useEffect, useState } from "react";
import { Address, isAddress } from "viem";

export function EmergencyContent() {
  const [chainId, setChainId] = useState<number>();
  const [addr, setAddr] = useState<Address>();

  const [isLoadedParams, setIsLoadedParams] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const chainId = params.get("chainId");
    const address = params.get("mc");

    if (chainId && !!chains.find((c) => c.id === +chainId)) {
      setChainId(+chainId);
    }
    if (address && isAddress(address)) {
      setAddr(address);
    }

    setIsLoadedParams(true);
  }, []);

  if (!isLoadedParams)
    return (
      <PageLayout title={"Emergency"}>
        <Container>
          <SkeletonStacks />
        </Container>
      </PageLayout>
    );

  if (!addr || !chainId) {
    return (
      <MarketConfiguratorList
        onSelect={(chainId: number, mc: Address) => {
          setChainId(chainId);
          setAddr(mc);
        }}
      />
    );
  }

  return (
    <MarketConfiguratorView
      chainId={chainId}
      address={addr}
      onClickBack={() => {
        setChainId(undefined);
        setAddr(undefined);
      }}
    />
  );
}

