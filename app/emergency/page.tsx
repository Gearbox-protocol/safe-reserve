import { SkeletonStacks } from "@/components/ui/skeleton";
import { Container } from "@gearbox-protocol/permissionless-ui";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EmergencyContent } from "./emergency-content";

export const metadata: Metadata = {
  title: "Emergency",
  description: "Manage emergency actions for Gearbox Safe",
};

export default function EmergencyPage() {
  return (
    <Suspense fallback={
      <Container>
        <SkeletonStacks />
      </Container>
    }>
      <EmergencyContent />
    </Suspense>
  );
}
