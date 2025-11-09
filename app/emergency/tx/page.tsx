"use client";

import { EmergencyActionView } from "@/components/emergency/tx/emergency-action-view";
import { SkeletonStacks } from "@/components/ui/skeleton";
import { chains } from "@/config/wagmi";
import {
  EmergencyActions,
  validateEmergencyAction,
} from "@/core/emergency-actions";
import { PageLayout } from "@gearbox-protocol/permissionless-ui";
import { Suspense, useEffect, useState } from "react";
import { Address, isAddress } from "viem";

function EmergencyTxContent() {
  const [chainId, setChainId] = useState<number>();
  const [addr, setAddr] = useState<Address>();
  const [action, setAction] = useState<EmergencyActions>();

  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const chainId = params.get("chainId");
    const address = params.get("mc");
    const actionType = params.get("action");
    const txParams = params.get("params");

    if (chainId && !!chains.find((c) => c.id === +chainId)) {
      setChainId(+chainId);
    } else {
      setIsError(true);
    }

    if (address && isAddress(address)) {
      setAddr(address);
    } else {
      setIsError(true);
    }

    if (actionType && txParams) {
      try {
        const action = validateEmergencyAction({
          type: actionType,
          params: JSON.parse(txParams),
        });
        setAction(action);
      } catch {
        setIsError(true);
      }
    } else {
      setIsError(true);
    }
  }, []);

  if (isError) return <div>Error: invalid tx URL</div>;

  if (!addr || !chainId || !action) {
    return (
      <PageLayout title={"Emergency tx"}>
        <SkeletonStacks />
      </PageLayout>
    );
  }

  return (
    <EmergencyActionView
      chainId={chainId}
      marketConfigurator={addr}
      action={action}
    />
  );
}

export default function EmergencyTxPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmergencyTxContent />
    </Suspense>
  );
}
