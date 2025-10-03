"use client";

import { ViewTxList } from "@/components/txs/view-tx-list";
import { Suspense, useEffect, useState } from "react";

function TxsContent() {
  const [cids, setCids] = useState<string[] | null | undefined>(undefined);

  useEffect(() => {
    // Read from URL after component mounts (client-side only)
    const params = new URLSearchParams(window.location.search);

    const cid = params.get("cid");
    const cids = params.get("cids")?.split(",");

    if (cids && Array.isArray(cids)) {
      setCids(cids);
    } else if (cid) {
      setCids([cid]);
    } else {
      setCids(null);
    }
  }, []);

  if (cids && cids.length > 0) {
    return <ViewTxList cids={cids} onSelect={setCids} />;
  } else if (cids === undefined) {
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
