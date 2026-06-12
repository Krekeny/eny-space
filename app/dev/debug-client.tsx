"use client";

import { useCallback, useEffect, useState } from "react";

// GET endpoints that proxy our backend / infrastructure provider.
const ENDPOINTS: { label: string; path: string }[] = [
  { label: "PDS service (infra provider)", path: "/api/pds/service" },
  { label: "PDS accounts", path: "/api/pds/atproto/accounts" },
];

type Result = {
  status: number | null;
  ok: boolean;
  durationMs: number;
  body: unknown;
  error?: string;
};

export function DebugClient() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    const next: Record<string, Result> = {};

    await Promise.all(
      ENDPOINTS.map(async ({ path }) => {
        const start = performance.now();
        try {
          const res = await fetch(path, { cache: "no-store" });
          const text = await res.text();
          let body: unknown = text;
          try {
            body = JSON.parse(text);
          } catch {
            // not JSON — keep raw text
          }
          const result: Result = {
            status: res.status,
            ok: res.ok,
            durationMs: Math.round(performance.now() - start),
            body,
          };
          console.log(`[debug] GET ${path}`, result);
          next[path] = result;
        } catch (e) {
          const result: Result = {
            status: null,
            ok: false,
            durationMs: Math.round(performance.now() - start),
            body: null,
            error: e instanceof Error ? e.message : String(e),
          };
          console.error(`[debug] GET ${path} failed`, e);
          next[path] = result;
        }
      }),
    );

    setResults(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="self-start rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
      >
        {loading ? "Fetching…" : "Refresh all"}
      </button>

      {ENDPOINTS.map(({ label, path }) => {
        const r = results[path];
        return (
          <section
            key={path}
            className="rounded-md border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="truncate font-mono text-xs text-white/40">
                  GET {path}
                </p>
              </div>
              {r && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.ok
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {r.status ?? "ERR"} · {r.durationMs}ms
                </span>
              )}
            </div>
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-neutral-900/90 p-3 text-xs text-neutral-100">
              {r
                ? r.error ?? JSON.stringify(r.body, null, 2)
                : loading
                  ? "Fetching…"
                  : "—"}
            </pre>
          </section>
        );
      })}
    </div>
  );
}
