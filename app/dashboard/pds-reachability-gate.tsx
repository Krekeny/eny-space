"use client";

import { useEffect, useState } from "react";
import { Paragraph } from "@/components/paragraph";

type Status = "checking" | "reachable" | "unreachable";

/**
 * Holds the management forms until the PDS actually answers, not just until the
 * backend reports "running". After first creation, DNS/cert propagation can lag
 * a few minutes — acting before then just produces confusing failures. Retries
 * until reachable, then unlocks automatically.
 */
export function PdsReachabilityGate({
  pdsHost,
  children,
}: {
  pdsHost: string | null;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>(pdsHost ? "checking" : "reachable");

  useEffect(() => {
    if (!pdsHost) return;
    let active = true;
    let timer: ReturnType<typeof setInterval>;
    const base = pdsHost.replace(/\/$/, "");

    const check = async () => {
      try {
        const res = await fetch(`${base}/xrpc/_health`, { cache: "no-store" });
        if (!active) return;
        if (res.ok) {
          setStatus("reachable");
          clearInterval(timer);
        } else {
          setStatus("unreachable");
        }
      } catch {
        if (active) setStatus("unreachable");
      }
    };

    check();
    timer = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pdsHost]);

  if (status === "reachable") return <>{children}</>;

  return (
    <div className="flex items-start gap-3 rounded-md border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
      <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400 animate-pulse" />
      <div className="space-y-1">
        <Paragraph className="text-sm font-semibold text-amber-200">
          {status === "checking"
            ? "Connecting to your PDS…"
            : "Your PDS is finishing setup"}
        </Paragraph>
        <Paragraph className="text-sm text-amber-100/90">
          After it&apos;s first created, DNS and certificates can take a few
          minutes to propagate. Account creation, migration and invites will
          unlock automatically once it&apos;s reachable. No need to refresh.
        </Paragraph>
      </div>
    </div>
  );
}
