"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Paragraph } from "@/components/paragraph";

type HealthStatus = "checking" | "reachable" | "unreachable";

type DescribeServer = {
  did?: string;
  availableUserDomains?: string[];
  links?: {
    privacyPolicy?: string;
    termsOfService?: string;
  };
};

function StatusDot({ status }: { status: HealthStatus }) {
  if (status === "checking")
    return <span className="inline-block h-2 w-2 rounded-full bg-white/30 animate-pulse" />;
  if (status === "reachable")
    return <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />;
  return <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />;
}

export function PdsHealthClient({ pdsHost }: { pdsHost: string }) {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [version, setVersion] = useState<string | null>(null);
  const [describe, setDescribe] = useState<DescribeServer | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  const check = async () => {
    setStatus("checking");
    const base = pdsHost.replace(/\/$/, "");
    try {
      const [healthRes, describeRes] = await Promise.all([
        fetch(`${base}/xrpc/_health`, { cache: "no-store" }),
        fetch(`${base}/xrpc/com.atproto.server.describeServer`, { cache: "no-store" }),
      ]);

      if (healthRes.ok) {
        const data = await healthRes.json().catch(() => ({}));
        setVersion(data?.version ?? null);
        setStatus("reachable");
      } else {
        setStatus("unreachable");
      }

      if (describeRes.ok) {
        setDescribe(await describeRes.json().catch(() => null));
      }
    } catch {
      setStatus("unreachable");
    }
    setCheckedAt(new Date());
  };

  useEffect(() => {
    check();
  }, [pdsHost]);

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-white/5 p-4 text-white backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left"
          aria-expanded={open}
        >
          <StatusDot status={status} />
          <Paragraph className="text-sm font-semibold">
            {status === "checking" && "Checking…"}
            {status === "reachable" && "Reachable"}
            {status === "unreachable" && "Unreachable"}
          </Paragraph>
          {version && (
            <Paragraph className="text-xs text-white/50 font-mono">v{version}</Paragraph>
          )}
          <ChevronDownIcon
            className={`size-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <button
          onClick={check}
          className="text-xs text-white/40 hover:text-white/80 transition-colors"
        >
          Refresh
        </button>
      </div>

      {open && (
        <>
          {checkedAt && (
            <Paragraph className="text-xs text-white/40">
              Last checked {checkedAt.toLocaleTimeString()}
            </Paragraph>
          )}

          {describe && (
            <div className="grid gap-2 text-sm md:grid-cols-2">
              {describe.did && (
                <div className="space-y-0.5">
                  <Paragraph className="text-xs font-medium text-white/60">DID</Paragraph>
                  <Paragraph className="font-mono text-xs text-white break-all">{describe.did}</Paragraph>
                </div>
              )}
              {Array.isArray(describe.availableUserDomains) && describe.availableUserDomains.length > 0 && (
                <div className="space-y-0.5">
                  <Paragraph className="text-xs font-medium text-white/60">User domains</Paragraph>
                  <Paragraph className="font-mono text-xs text-white">
                    {describe.availableUserDomains.join(", ")}
                  </Paragraph>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
