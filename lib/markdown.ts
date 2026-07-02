import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

/** Render a markdown string (GFM: tables, etc.) to an HTML string. */
export async function markdownToHtml(md: string): Promise<string> {
  const processed = await remark().use(remarkGfm).use(remarkHtml).process(md);
  return String(processed);
}
