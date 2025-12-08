import { SkeletonStacks } from "@/components/ui/skeleton";
import { Container } from "@gearbox-protocol/permissionless-ui";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EmergencyTxContent } from "./emergency-tx-content";

export const metadata: Metadata = {
  title: "Emergency Transaction",
  description: "View and manage emergency transactions for Gearbox Safe",
};

export default function EmergencyTxPage() {
  return (
    <Suspense fallback={
      <Container>
        <SkeletonStacks />
      </Container>
    }>
      <EmergencyTxContent />
    </Suspense>
  );
}
