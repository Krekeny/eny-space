"use client";

import { useEffect, useState } from "react";

const KEY = "blog-reader-mode";

// eny.space "fancy" look: Doto headings, mono body (inherited), violet code.
const FANCY =
  "prose-headings:font-heading prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-white prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-violet-400/20 prose-pre:bg-violet-500/10 prose-pre:text-violet-50";

// "Reader" look: larger, relaxed, neutral — optimized for long-form reading.
const READER =
  "prose-lg prose-a:text-primary prose-a:underline prose-a:underline-offset-2 prose-code:text-white prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-white/5";

const READER_FONT =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function ArticleReader({
  title,
  dateLabel,
  publishedAt,
  description,
  html,
  authorSlot,
}: {
  title: string;
  dateLabel: string;
  publishedAt: string;
  description?: string;
  html: string;
  authorSlot?: React.ReactNode;
}) {
  const [mode, setMode] = useState<"fancy" | "reader">("fancy");

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "reader" || saved === "fancy") setMode(saved);
  }, []);

  const select = (next: "fancy" | "reader") => {
    setMode(next);
    localStorage.setItem(KEY, next);
  };

  const MODES = [
    { id: "fancy", label: "Styled" },
    { id: "reader", label: "Reader" },
  ] as const;

  const isReader = mode === "reader";

  return (
    <>
      {/* Reader mode dims the fancy site background — fades in/out. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-4 bg-slate-950/80 transition-opacity duration-500 ${
          isReader ? "opacity-100" : "opacity-0"
        }`}
      />

      <article
        className="mt-8 transition-[font-size,line-height,color] duration-300"
        style={isReader ? { fontFamily: READER_FONT } : undefined}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <time
            dateTime={publishedAt}
            className="text-xs uppercase tracking-widest text-white/40"
          >
            {dateLabel}
          </time>
          <div
            role="group"
            aria-label="Reading style"
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => select(m.id)}
                aria-pressed={mode === m.id}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  mode === m.id
                    ? "bg-white text-neutral-950"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <header className="mb-8">
          <h1
            className={`text-3xl tracking-tight text-white sm:text-4xl ${
              isReader ? "font-semibold" : "font-heading"
            }`}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-lg leading-relaxed text-white/60">
              {description}
            </p>
          )}
          {authorSlot && <div className="mt-5">{authorSlot}</div>}
        </header>

        <div
          className={`prose prose-invert max-w-none prose-p:leading-[1.9] prose-li:leading-[1.9] prose-headings:leading-snug prose-img:mx-auto prose-img:max-h-[70vh] prose-img:w-auto prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-figcaption:text-center [&_p:has(>img)+p]:!mt-3 [&_p:has(>img)+p]:text-center [&_p:has(>img)+p]:text-sm [&_p:has(>img)+p]:text-white/40 [&_*]:transition-[color,background-color,border-color,font-size] [&_*]:duration-300 [&_del]:text-white/35 [&_del]:decoration-white/25 ${
            isReader ? READER : FANCY
          }`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </>
  );
}
