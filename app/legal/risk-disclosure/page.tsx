import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { promises as fs } from "fs";
import { notFound } from "next/navigation";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Disclosure Statement",
  description: "Risk Disclosure Statement for Gearbox Safe",
};

export default async function RiskDisclosurePage() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "legal",
      "risk-disclosure-statement.md"
    );
    const content = await fs.readFile(filePath, "utf8");

    return (
      <MarkdownViewer content={content} title={"Risk Disclosure Statement"} />
    );
  } catch (error) {
    console.error("Error reading legal document:", error);
    notFound();
  }
}
