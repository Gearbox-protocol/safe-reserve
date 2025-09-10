"use client";

import { chains } from "@/config/wagmi";
import {
  EmergencyActions,
  validateEmergencyAction,
} from "@/core/emergency-actions";
import { Suspense, useEffect, useState } from "react";
import { Address, isAddress } from "viem";
import { EmergencyActionView } from "../../../components/emergency/tx/emergency-action-view";

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
    return <div>Loading...</div>;
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
