import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { markdownToHtml } from "@/lib/markdown";

// Source of truth: content/legal/privacy.md — edit the markdown, this page
// re-renders it. (Draft: resolve the [[CONFIRM: …]] markers and remove the
// draft/companion notes before releasing to production.)
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How eny.space (Krekeny GmbH) collects, uses, and protects your data.",
};

export default async function PrivacyPolicyPage() {
  const md = fs.readFileSync(
    path.join(process.cwd(), "content/legal/privacy.md"),
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
