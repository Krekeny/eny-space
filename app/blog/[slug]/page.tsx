import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getAllSlugs, getPost } from "@/lib/blog";
import { AuthorByline } from "../author-byline";
import { ArticleReader } from "../article-reader";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  // Use the generic site OG card for now. A post-specific card exists
  // (public/og-blog.png, generated via `pnpm og`) but is intentionally not
  // wired up yet.
  const ogImage = "/og.png";

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  // Per-post proof of the standard.site record. The AT-URI is computable from
  // DID + slug; App Router hoists this <link> into <head>.
  const did = process.env.ATP_DID?.trim();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      {did && (
        <link
          rel="site.standard.document"
          href={`at://${did}/site.standard.document/${post.slug}`}
        />
      )}

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        All posts
      </Link>

      <ArticleReader
        title={post.title}
        dateLabel={formatDate(post.publishedAt)}
        publishedAt={post.publishedAt}
        description={post.description}
        html={post.html}
        authorSlot={post.author ? <AuthorByline author={post.author} /> : null}
      />
    </div>
  );
}
