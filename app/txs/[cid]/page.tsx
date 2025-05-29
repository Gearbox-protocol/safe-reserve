"use server";

import { ViewTxList } from "@/components/txs/view-tx-list";

export default async function ProposalsListPage({
  params,
}: {
  params: { cid: string };
}) {
  if (params.cid) {
    return <ViewTxList cid={params.cid} />;
  } else {
    return <div>Invalid ipfs cid</div>;
  }
}
