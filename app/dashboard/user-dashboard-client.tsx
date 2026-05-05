"use client";

import { useEffect, useMemo, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/actions/components/ui/button";
import { Input } from "@/actions/components/ui/input";
import { Label } from "@/actions/components/ui/label";

type ServiceResponse = {
  hostname?: string;
  encrypted_config?: { hostname?: string };
  state?: number | string;
};

function stripScheme(hostname?: string) {
  if (!hostname) return "";
  return hostname.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

export function UserDashboardClient() {
  const [pdsHost, setPdsHost] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [handle, setHandle] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const pdsBareHost = useMemo(() => stripScheme(pdsHost), [pdsHost]);
  const fullHandle = useMemo(
    () => (handle && pdsBareHost ? `${handle}.${pdsBareHost}` : ""),
    [handle, pdsBareHost],
  );

  useEffect(() => {
    fetch("/api/pds/service")
      .then((r) => r.json())
      .then((data: ServiceResponse) => {
        const host = data?.hostname || data?.encrypted_config?.hostname || "";
        setPdsHost(host ? `https://${stripScheme(host)}` : "");
      })
      .catch((e) => setFetchError(e instanceof Error ? e.message : "Failed to load PDS info"));
  }, []);

  const call = async (path: string, body: unknown) => {
    setLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.message || payload?.payload?.message || "Request failed");
      }
      return payload;
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      const payload = await call("/api/pds/atproto/invite", { useCount: 1 });
      const code = payload?.code || payload?.inviteCode || "";
      setInviteCode(code);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  const createAccount = async () => {
    if (!handle || !password || !inviteCode) return;
    try {
      await call("/api/pds/atproto/create-account", {
        handle: fullHandle,
        password,
        inviteCode,
      });
      setActionSuccess(`Account created: ${fullHandle}`);
      setHandle("");
      setPassword("");
      setInviteCode("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  };

  if (fetchError) {
    return (
      <Paragraph className="text-sm text-rose-300">{fetchError}</Paragraph>
    );
  }

  return (
    <div className="space-y-8">
      {/* Invite code */}
      <section className="space-y-3">
        <Paragraph className="text-sm font-semibold text-white/80 uppercase tracking-wide">
          Invitation code
        </Paragraph>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={createInvite} disabled={loading || !pdsHost} className="rounded-full">
            {loading ? "Working…" : "Generate invite"}
          </Button>
          {inviteCode && (
            <Paragraph className="font-mono text-sm text-white break-all">{inviteCode}</Paragraph>
          )}
        </div>
      </section>

      {/* Create user */}
      <section className="space-y-4">
        <Paragraph className="text-sm font-semibold text-white/80 uppercase tracking-wide">
          Create user
        </Paragraph>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="handle">Handle</Label>
            <div className="flex items-center gap-1">
              <Input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="username"
                className="flex-1"
              />
              {pdsBareHost && (
                <Paragraph className="text-xs text-white/40 whitespace-nowrap">.{pdsBareHost}</Paragraph>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="invite">Invite code</Label>
            <Input
              id="invite"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Paste invite code or generate one above"
              className="font-mono"
            />
          </div>
        </div>
        <Button
          onClick={createAccount}
          disabled={loading || !handle || !password || !inviteCode || !pdsHost}
          className="rounded-full"
        >
          {loading ? "Working…" : "Create account"}
        </Button>
      </section>

      {actionSuccess && (
        <Paragraph className="text-sm text-emerald-300">{actionSuccess}</Paragraph>
      )}
      {actionError && (
        <Paragraph className="text-sm text-rose-300 break-all">{actionError}</Paragraph>
      )}
    </div>
  );
}
