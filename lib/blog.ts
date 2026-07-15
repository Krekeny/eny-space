import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

// Markdown is the canonical source of truth. Posts live in content/blog/*.md(x)
// with frontmatter: title, date, description, optional slug (default = filename),
// optional tags. This module is the single content system — both the /blog pages
// and scripts/sync-standard.ts read posts through here.

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const POST_EXTENSIONS = [".md", ".mdx"];

export type Author = {
  /** Optional; if omitted, resolved from the Bluesky profile (handle/did). */
  name?: string;
  /** Bluesky handle, e.g. "samsour.de" — used to build the profile link + fetch avatar. */
  handle?: string;
  did?: string;
};

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  /** Raw frontmatter date, kept for display. */
  date: string;
  /** Normalized ISO-8601, used for sorting and the standard.site record. */
  publishedAt: string;
  tags: string[];
  /** Optional byline. Frontmatter `author` may be a string (name) or an object. */
  author?: Author;
  /**
   * Optional canonical URL. Set when the post is cross-posted and the canonical
   * copy lives elsewhere (e.g. "https://eny.social/blog/<slug>"). Defaults to the
   * post's own URL when omitted.
   */
  canonical?: string;
  /** Optional visible cross-post note, e.g. "Originally published on eny.social…". */
  canonicalNote?: string;
};

export type Post = PostMeta & { html: string };

/**
 * Constrain a slug to a valid atproto rkey: `[a-zA-Z0-9._~:-]`, length 1–512,
 * never "." or "..". The same value is the file slug, the URL segment, and the
 * record rkey — so the AT-URI is computable from DID + slug.
 */
export function sanitizeSlug(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9._~:-]/g, "-").slice(0, 512);
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new Error(`Invalid slug derived from "${raw}"`);
  }
  return cleaned;
}

function toIso(value: unknown): string {
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Unparseable post date: ${String(value)}`);
  }
  return d.toISOString();
}

function parseAuthor(value: unknown): Author | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return { name: value };
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const author: Author = {
      name: o.name ? String(o.name) : undefined,
      handle: o.handle ? String(o.handle) : undefined,
      did: o.did ? String(o.did) : undefined,
    };
    // Any one of name / handle / did is enough — the rest is fetched from the
    // Bluesky profile at render time.
    if (!author.name && !author.handle && !author.did) return undefined;
    return author;
  }
  return undefined;
}

function isPostFile(file: string): boolean {
  return POST_EXTENSIONS.includes(path.extname(file).toLowerCase());
}

function listPostFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter(isPostFile);
}

function parseFile(file: string): { meta: PostMeta; body: string } {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);

  const fileSlug = path.basename(file, path.extname(file));
  const slug = sanitizeSlug(String(data.slug || fileSlug));

  if (!data.title) throw new Error(`Post "${file}" is missing a title`);
  if (!data.date) throw new Error(`Post "${file}" is missing a date`);

  const tags = Array.isArray(data.tags)
    ? data.tags.map((t) => String(t))
    : [];

  return {
    meta: {
      slug,
      title: String(data.title),
      description: String(data.description ?? ""),
      date: String(data.date),
      publishedAt: toIso(data.date),
      tags,
      author: parseAuthor(data.author),
      canonical: data.canonical ? String(data.canonical) : undefined,
      canonicalNote: data.canonicalNote
        ? String(data.canonicalNote)
        : undefined,
    },
    body: content,
  };
}

/** All posts' metadata, newest first. No bodies rendered. */
export function getAllPostMeta(): PostMeta[] {
  return listPostFiles()
    .map((file) => parseFile(file).meta)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getAllSlugs(): string[] {
  return getAllPostMeta().map((p) => p.slug);
}

async function renderMarkdown(body: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(body);
  return String(processed);
}

/** A single post with rendered HTML body, or null if the slug doesn't exist. */
export async function getPost(slug: string): Promise<Post | null> {
  const file = listPostFiles().find(
    (f) => sanitizeSlug(path.basename(f, path.extname(f))) === slug,
  );
  // Fall back to matching an explicit frontmatter slug.
  const match =
    file ??
    listPostFiles().find((f) => parseFile(f).meta.slug === slug);
  if (!match) return null;

  const { meta, body } = parseFile(match);
  return { ...meta, html: await renderMarkdown(body) };
}
