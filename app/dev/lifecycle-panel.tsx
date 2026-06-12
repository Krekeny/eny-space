"use client";

import { useCallback, useEffect, useState } from "react";
import {
  effectiveLifecycle,
  type PdsLifecycleStatus,
} from "@/lib/pds-lifecycle";

type Lifecycle = {
  lifecycle_status?: string;
  lifecycle_reason?: string | null;
  grace_until?: string | null;
  delete_at?: string | null;
  pds_service_id?: number | null;
} | null;

const ACTIONS: { action: string; label: string; tone: "default" | "danger" }[] =
  [
    { action: "cancel", label: "Simulate cancel", tone: "default" },
    { action: "past_due", label: "Simulate payment failed", tone: "default" },
    { action: "sweep", label: "Advance time (sweep)", tone: "default" },
    { action: "reactivate", label: "Reactivate", tone: "default" },
    { action: "reset", label: "Reset to active", tone: "danger" },
  ];

function fmt(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  const deltaMs = d.getTime() - Date.now();
  const rel =
    Math.abs(deltaMs) < 60_000
      ? `${Math.round(deltaMs / 1000)}s`
      : `${Math.round(deltaMs / 60_000)}m`;
  return `${d.toLocaleString()} (${deltaMs >= 0 ? "in " : ""}${rel}${deltaMs < 0 ? " ago" : ""})`;
}

export function LifecyclePanel() {
  const [lc, setLc] = useState<Lifecycle>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dev/lifecycle", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load");
      setLc(data.lifecycle ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Tick every second so relative times and the computed phase stay live.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const run = async (action: string) => {
    setBusy(action);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/dev/lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Action failed");
      setLc(data.lifecycle ?? null);
      const r = data.result;
      if (r && r.ok === false) setNote(r.message || "No change");
      else if (r && Array.isArray(r.transitions))
        setNote(
          r.transitions.length
            ? r.transitions.map((t: any) => `${t.from}→${t.to}`).join(", ")
            : "No transitions due yet",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const status = lc?.lifecycle_status ?? "—";
  const statusColor =
    status === "active"
      ? "text-emerald-300"
      : status === "grace"
        ? "text-amber-300"
        : status === "suspended"
          ? "text-orange-300"
          : status === "deleted"
            ? "text-rose-300"
            : "text-white/50";

  // What the phase *should* be right now given the timers. If it differs from
  // the persisted status, a sweep ("Advance time") is due.
  const effective: PdsLifecycleStatus | null = lc?.lifecycle_status
    ? effectiveLifecycle({
        status: lc.lifecycle_status as PdsLifecycleStatus,
        graceUntil: lc.grace_until ? new Date(lc.grace_until) : null,
        deleteAt: lc.delete_at ? new Date(lc.delete_at) : null,
      })
    : null;
  const sweepDue = effective !== null && effective !== status;

  return (
    <section className="rounded-md border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">PDS lifecycle</p>
          <p className="text-xs text-white/40">
            Drives your own PDS lifecycle without Stripe. Infra calls are logged,
            not executed, unless PDS_LIFECYCLE_ENABLED=true.
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-semibold ${statusColor}`}>
            {status}
          </span>
          {sweepDue && (
            <p className="text-xs text-sky-300">
              due → {effective} · click “Advance time”
            </p>
          )}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-xs text-white/70">
        <dt className="text-white/40">reason</dt>
        <dd>{lc?.lifecycle_reason ?? "—"}</dd>
        <dt className="text-white/40">grace until</dt>
        <dd className="font-mono">{fmt(lc?.grace_until)}</dd>
        <dt className="text-white/40">delete at</dt>
        <dd className="font-mono">{fmt(lc?.delete_at)}</dd>
        <dt className="text-white/40">service id</dt>
        <dd className="font-mono">{lc?.pds_service_id ?? "—"}</dd>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label, tone }) => (
          <button
            key={action}
            type="button"
            onClick={() => run(action)}
            disabled={busy !== null}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              tone === "danger"
                ? "border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                : "border border-white/20 text-white/80 hover:border-white/40 hover:text-white"
            }`}
          >
            {busy === action ? "…" : label}
          </button>
        ))}
        <button
          type="button"
          onClick={refresh}
          disabled={busy !== null}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      {note && <p className="mt-3 text-xs text-sky-300">{note}</p>}
      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
    </section>
  );
}
