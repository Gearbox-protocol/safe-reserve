import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { promises as fs } from "fs";
import { notFound } from "next/navigation";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "Privacy Notice for Gearbox Safe",
};

export default async function PrivacyNoticePage() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "legal",
      "privacy-notice.md"
    );
    const content = await fs.readFile(filePath, "utf8");

    return <MarkdownViewer content={content} title={"Privacy Notice"} />;
  } catch (error) {
    console.error("Error reading legal document:", error);
    notFound();
  }
}
