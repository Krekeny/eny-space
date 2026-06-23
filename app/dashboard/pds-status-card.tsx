"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/actions/components/ui/card";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { pdsStateLabel, pdsStateType } from "@/lib/pds-state";
import { SupportDialog } from "@/components/support/support-dialog";
import { PdsHealthClient } from "./pds-health-client";

const POLL_INTERVAL_MS = 5000;

type Props = {
  initialState: number | string | null;
  initialHostname: string | null;
  userEmail?: string | null;
  startedAt?: string | null;
};

// Fake-but-honest setup bar: ~3 min, capped below 100% until the PDS is ready.
// What? A relatively accurate fake bar is better than nothing
const SETUP_DURATION_MS = 3 * 60 * 1000;
const SETUP_CAP = 0.95;

export function PdsStatusCard({
  initialState,
  initialHostname,
  userEmail,
  startedAt,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [hostname, setHostname] = useState(initialHostname);

  const stateType = pdsStateType(state);
  const statusLabel = pdsStateLabel(state);
  const isError = Number(state) === 9;
  const isPending = stateType === "pending";

  const startMs = useMemo(() => {
    const t = startedAt ? new Date(startedAt).getTime() : Date.now();
    return Number.isFinite(t) ? t : Date.now();
  }, [startedAt]);

  const computeProgress = useCallback(
    () => Math.min(SETUP_CAP, Math.max(0, (Date.now() - startMs) / SETUP_DURATION_MS)),
    [startMs],
  );
  // Start at 0 (deterministic for SSR), then the effect catches up to elapsed.
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPending) return;
    setProgress(computeProgress());
    const id = setInterval(() => setProgress(computeProgress()), 1000);
    return () => clearInterval(id);
  }, [isPending, computeProgress]);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/pds/service");
      if (!res.ok) return;
      const data = await res.json();
      const newState = data?.state ?? null;
      const newHostname =
        data?.hostname || data?.encrypted_config?.hostname || null;
      setState(newState);
      if (newHostname) setHostname(newHostname);
      if (pdsStateType(newState) === "ready") {
        router.refresh();
      }
    } catch {
      // ignore transient fetch errors
    }
  }, [router]);

  useEffect(() => {
    if (stateType !== "pending") return;
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [stateType, poll]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              stateType === "ready"
                ? "bg-emerald-400"
                : stateType === "failed"
                  ? "bg-red-500"
                  : "bg-amber-400 animate-pulse"
            }`}
          />
          <Heading as="h2" className="text-base font-semibold text-white">
            {statusLabel}
          </Heading>
        </div>
        {hostname && (
          <Paragraph className="text-sm text-white/60 font-mono">
            {hostname}
          </Paragraph>
        )}
        {isPending && (
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-400 transition-[width] duration-1000 ease-linear"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <Paragraph className="text-xs text-white/40">
              This usually takes a few minutes. You can leave and come back —
              we&apos;ll keep going.
            </Paragraph>
          </div>
        )}
        {isError && (
          <Paragraph className="text-sm text-white/60">
            Oops — we can see your PDS isn&apos;t deploying correctly, and
            we&apos;re already on it.<br />If you have anything to add, or just want
            to say hello, you can{" "}
            <SupportDialog
              context="pds-setup-error"
              userEmail={userEmail}
              details={[
                { label: "PDS", value: hostname },
                { label: "Status", value: statusLabel },
              ]}
            >
              write us
            </SupportDialog>{" "}
            any time.
          </Paragraph>
        )}
      </CardHeader>
      {hostname && stateType === "ready" && (
        <CardContent>
          <PdsHealthClient pdsHost={`https://${hostname}`} />
        </CardContent>
      )}
    </Card>
  );
}
