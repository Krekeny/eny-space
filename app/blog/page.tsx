import Link from "next/link";
import type { Metadata } from "next";
import { Heading } from "@/components/heading";
import { getAllPostMeta } from "@/lib/blog";

// ISR: regenerate periodically so newly deployed posts surface without a manual
// rebuild loop.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on managed PDS hosting and the atmosphere, from eny.space.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPostMeta();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <header className="mb-12">
        <Heading className="text-4xl tracking-tight text-white sm:text-5xl">
          Blog
        </Heading>
        <p className="mt-3 text-white/50">Notes from building eny.space.</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-white/50">No posts yet.</p>
      ) : (
        <ul className="space-y-10">
          {posts.map((post) => (
            <li key={post.slug}>
              <article>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <time
                    dateTime={post.publishedAt}
                    className="text-xs uppercase tracking-widest text-white/40"
                  >
                    {formatDate(post.publishedAt)}
                  </time>
                  <Heading
                    as="h2"
                    className="mt-2 text-2xl text-white transition-colors group-hover:text-primary"
                  >
                    {post.title}
                  </Heading>
                  {post.description && (
                    <p className="mt-2 leading-relaxed text-white/60">
                      {post.description}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
