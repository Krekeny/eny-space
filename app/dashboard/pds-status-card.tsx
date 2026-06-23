"use client";

import { useState, useEffect, useCallback } from "react";
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
};

export function PdsStatusCard({
  initialState,
  initialHostname,
  userEmail,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [hostname, setHostname] = useState(initialHostname);

  const stateType = pdsStateType(state);
  const statusLabel = pdsStateLabel(state);
  const isError = Number(state) === 9;

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
        {isError && (
          <Paragraph className="text-sm text-white/60">
            Oops — we can see your PDS isn&apos;t deploying correctly, and
            we&apos;re already on it. If you have anything to add, or just want
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
