import { TxsContent } from "./txs-content";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonStacks } from "@/components/ui/skeleton";
import { Container } from "@gearbox-protocol/permissionless-ui";

export const metadata: Metadata = {
  title: "Transactions",
  description: "View and manage Gearbox Safe transactions",
};

export default function TxsPage() {
  return (
    <Suspense fallback={
      <Container>
        <SkeletonStacks />
      </Container>
    }>
      <TxsContent />
    </Suspense>
  );
}
