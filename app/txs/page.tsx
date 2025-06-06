"use client";

import { ViewTxList } from "@/components/txs/view-tx-list";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TxsContent() {
  const searchParams = useSearchParams();
  const cid = searchParams.get('cid');

  if (cid) {
    return <ViewTxList cid={cid} />;
  } else {
    return <div>Please provide a valid IPFS CID in the URL: /txs?cid=your_cid_here</div>;
  }
}

export default function TxsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TxsContent />
    </Suspense>
  );
} 