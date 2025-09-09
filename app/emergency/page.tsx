"use client";

import { MarketConfiguratorList } from "@/components/emergency/market-configurator-list";
import { MarketConfiguratorView } from "@/components/emergency/market-configurator-view";
import { chains } from "@/config/wagmi";
import { Suspense, useEffect, useState } from "react";
import { Address, isAddress } from "viem";

function EmergencyContent() {
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

  if (!isLoadedParams) return <div>Loading...</div>;

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

export default function EmergencyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmergencyContent />
    </Suspense>
  );
}
