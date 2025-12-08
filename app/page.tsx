import ViewMain from "@/components/main/view-main";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Multisig",
  description: "Gearbox Safe - Manage transactions and emergency actions",
};

export default function Home() {
  return <ViewMain />;
}
