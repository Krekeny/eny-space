import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { markdownToHtml } from "@/lib/markdown";

// Source of truth: content/legal/terms.md — edit the markdown, this page
// re-renders it.
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of eny.space (Krekeny GmbH).",
};

export default async function TermsOfServicePage() {
  const md = fs.readFileSync(
    path.join(process.cwd(), "content/legal/terms.md"),
    "utf8",
  );
  const html = await markdownToHtml(md);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <div
        className="prose prose-invert max-w-none prose-headings:font-heading prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
