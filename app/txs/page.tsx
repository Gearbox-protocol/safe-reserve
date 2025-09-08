"use client";

import { ViewTxList } from "@/components/txs/view-tx-list";
import { Suspense, useEffect, useState } from "react";

function TxsContent() {
  const [cid, setCid] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    // Read from URL after component mounts (client-side only)
    const params = new URLSearchParams(window.location.search);
    setCid(params.get("cid"));
  }, []);

  if (cid) {
    return <ViewTxList cid={cid} />;
  } else if (cid === undefined) {
    <div>Loading...</div>;
  } else {
    return (
      <div>
        Please provide a valid IPFS CID in the URL: /txs?cid=your_cid_here
      </div>
    );
  }
}

export default function TxsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TxsContent />
    </Suspense>
  );
}
