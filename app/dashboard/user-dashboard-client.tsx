"use client";

import { useEffect, useMemo, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/actions/components/ui/button";
import { Input } from "@/actions/components/ui/input";
import { Label } from "@/actions/components/ui/label";

type ServiceResponse = {
  hostname?: string;
  encrypted_config?: { hostname?: string };
};

function stripScheme(hostname?: string) {
  if (!hostname) return "";
  return hostname.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

async function apiCall(path: string, body: unknown) {
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
}

export function UserDashboardClient() {
  const [pdsBareHost, setPdsBareHost] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pds/service")
      .then((r) => r.json())
      .then((data: ServiceResponse) => {
        const host = data?.hostname || data?.encrypted_config?.hostname || "";
        setPdsBareHost(stripScheme(host));
      })
      .catch((e) => setFetchError(e instanceof Error ? e.message : "Failed to load PDS info"));
  }, []);

  if (fetchError) {
    return <Paragraph className="text-sm text-rose-300">{fetchError}</Paragraph>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <CreateUserSection pdsBareHost={pdsBareHost} />
        <InviteSection />
      </div>
      <UsersSection />
    </div>
  );
}

function CreateUserSection({ pdsBareHost }: { pdsBareHost: string }) {
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fullHandle = useMemo(
    () => (handle && pdsBareHost ? `${handle}.${pdsBareHost}` : ""),
    [handle, pdsBareHost],
  );

  const submit = async () => {
    if (!handle || !password) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiCall("/api/pds/atproto/create-account", {
        handle: fullHandle,
        password,
      });
      setSuccess(`Account created: ${fullHandle}`);
      setHandle("");
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
      <div>
        <Paragraph className="text-sm font-semibold text-white">Create user</Paragraph>
        <Paragraph className="text-xs text-white/50 mt-1">
          Directly create an account on your PDS.
        </Paragraph>
      </div>
      <div className="space-y-3">
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
          <Label htmlFor="new-password">Password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>
      </div>
      <Button
        onClick={submit}
        disabled={loading || !handle || !password || !pdsBareHost}
        className="rounded-full w-full"
      >
        {loading ? "Creating…" : "Create account"}
      </Button>
      {success && <Paragraph className="text-sm text-emerald-300">{success}</Paragraph>}
      {error && <Paragraph className="text-sm text-rose-300 break-all">{error}</Paragraph>}
    </section>
  );
}

function InviteSection() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setInviteCode(null);
    try {
      const payload = await apiCall("/api/pds/atproto/invite", { useCount: 1 });
      setInviteCode(payload?.code || payload?.inviteCode || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
      <div>
        <Paragraph className="text-sm font-semibold text-white">Invite someone</Paragraph>
        <Paragraph className="text-xs text-white/50 mt-1">
          Generate a one-time code for an external person to create their own account.
        </Paragraph>
      </div>
      <Button onClick={generate} disabled={loading} className="rounded-full w-full">
        {loading ? "Generating…" : "Generate invite code"}
      </Button>
      {inviteCode && (
        <div className="space-y-2">
          <Paragraph className="font-mono text-sm text-white break-all rounded bg-black/20 p-2">
            {inviteCode}
          </Paragraph>
          <Button onClick={copy} className="rounded-full w-full">
            {copied ? "Copied!" : "Copy code"}
          </Button>
        </div>
      )}
      {error && <Paragraph className="text-sm text-rose-300 break-all">{error}</Paragraph>}
    </section>
  );
}

type PdsAccount = {
  did: string;
  handle: string;
  email?: string;
  indexedAt?: string;
};

function UsersSection() {
  const [accounts, setAccounts] = useState<PdsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pds/atproto/accounts");
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`${payload?.message || "Failed to load accounts"} — ${JSON.stringify(payload?.upstream ?? {})}`);
      setAccounts(payload?.accounts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <Paragraph className="text-sm font-semibold text-white">Users</Paragraph>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs text-white/40 hover:text-white/80 transition-colors disabled:opacity-40"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <Paragraph className="text-sm text-rose-300">{error}</Paragraph>
      )}

      {!loading && !error && accounts.length === 0 && (
        <Paragraph className="text-sm text-white/40">No accounts found.</Paragraph>
      )}

      {accounts.length > 0 && (
        <div className="divide-y divide-white/5">
          {accounts.map((account) => (
            <div key={account.did} className="flex items-start justify-between gap-4 py-3 text-sm">
              <div className="space-y-0.5 min-w-0">
                <Paragraph className="font-medium text-white truncate">
                  {account.handle}
                </Paragraph>
                {account.email && (
                  <Paragraph className="text-xs text-white/50 truncate">{account.email}</Paragraph>
                )}
                <Paragraph className="font-mono text-xs text-white/30 truncate">{account.did}</Paragraph>
              </div>
              {account.indexedAt && (
                <Paragraph className="text-xs text-white/40 whitespace-nowrap shrink-0">
                  {new Date(account.indexedAt).toLocaleDateString()}
                </Paragraph>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
