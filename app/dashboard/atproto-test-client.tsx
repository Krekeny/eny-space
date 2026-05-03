"use client";

import { useEffect, useMemo, useState } from "react";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/actions/components/ui/button";

type ServiceResponse = {
  encrypted_config?: {
    hostname?: string;
  };
  state?: number | string;
};

function redactJwt(token: string | undefined) {
  if (!token) return "";
  if (token.length <= 20) return token;
  return `${token.slice(0, 15)}...${token.slice(-10)}`;
}

function stripScheme(hostname?: string) {
  if (!hostname) return "";
  return hostname.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
}

export function AtprotoTestClient() {
  const [pdsHost, setPdsHost] = useState<string>("");
  const [pdsState, setPdsState] = useState<number | string | null>(null);
  const [inviteCode, setInviteCode] = useState<string>("");

  const [email, setEmail] = useState<string>("");
  const [handlePrefix, setHandlePrefix] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");

  const [sessionIdentifier, setSessionIdentifier] = useState<string>("");
  const [sessionPassword, setSessionPassword] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const pdsBareHost = useMemo(() => stripScheme(pdsHost), [pdsHost]);
  const fullHandle = useMemo(
    () => (handlePrefix && pdsBareHost ? `${handlePrefix}.${pdsBareHost}` : ""),
    [handlePrefix, pdsBareHost],
  );
  const pdsStateNum = useMemo(() => {
    if (pdsState === null) return null;
    const n = typeof pdsState === "number" ? pdsState : Number(pdsState);
    return Number.isFinite(n) ? n : null;
  }, [pdsState]);
  const isPdsReady = pdsStateNum !== null && pdsStateNum >= 3;
  const createAccountDisabled =
    loading || !inviteCode || !handlePrefix || !newPassword || !isPdsReady;
  const createSessionDisabled =
    loading || !handlePrefix || !newPassword || !isPdsReady;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/pds/service", { method: "GET" });
        if (!res.ok) throw new Error(`Failed to load service (${res.status})`);
        const data = (await res.json()) as ServiceResponse;
        const host = data?.encrypted_config?.hostname || "";
        setPdsHost(host);
        setPdsState(data?.state ?? null);

        if (!handlePrefix && host) {
          const bare = stripScheme(host);
          setHandlePrefix("user1");
          setSessionIdentifier(`user1.${bare}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    };
    load();
  }, []);

  const call = async (path: string, body: any) => {
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await res.json()
        : await res.text().catch(() => "");

      if (!res.ok) {
        if (typeof payload === "string") {
          throw new Error(payload);
        }

        const upstreamMessage =
          payload?.payload?.message ||
          payload?.payload?.error ||
          payload?.message;

        const details = {
          route: path,
          httpStatus: res.status,
          upstream: payload?.payload,
          message: upstreamMessage || "Request failed",
        };

        throw new Error(JSON.stringify(details, null, 2));
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
      setOutput(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const createAccount = async () => {
    try {
      const payload = await call("/api/pds/atproto/create-account", {
        email,
        handle: fullHandle,
        password: newPassword,
        inviteCode,
      });
      setOutput(payload);
      setSessionIdentifier(fullHandle);
      setSessionPassword(newPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const createSession = async () => {
    try {
      const payload = await call("/api/pds/atproto/create-session", {
        identifier: sessionIdentifier || fullHandle,
        password: sessionPassword || newPassword,
      });
      setOutput(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-4 text-white backdrop-blur-xl">
      <Heading
        as="h2"
        className="text-sm font-semibold uppercase tracking-wide text-white/80"
      >
        AT Protocol (test)
      </Heading>

      {pdsHost ? (
        <Paragraph className="text-sm text-white/70">
          PDS endpoint:{" "}
          <a
            href={pdsHost}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-white underline underline-offset-2 hover:text-white/80"
          >
            {pdsHost}
          </a>
        </Paragraph>
      ) : (
        <Paragraph className="text-sm text-white/70">Loading PDS endpoint…</Paragraph>
      )}

      {pdsStateNum !== null && !isPdsReady && (
        <Paragraph className="text-sm text-amber-100/90">
          PDS not ready yet (state={pdsStateNum}). Waiting for provisioning to finish.
        </Paragraph>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={createInvite}
            disabled={loading || !pdsBareHost || !isPdsReady}
            className="rounded-full"
          >
            {loading ? "Working..." : "Create invite"}
          </Button>
        </div>

        {inviteCode && (
          <div className="space-y-1">
            <Paragraph className="text-xs font-medium text-white/60">
              Invite code
            </Paragraph>
            <Paragraph className="font-mono text-white break-all">
              {inviteCode}
            </Paragraph>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <Paragraph className="text-xs font-medium text-white/60">
            Email (optional)
          </Paragraph>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50"
            placeholder="leave blank to reuse your own email"
          />
        </label>

        <label className="space-y-1">
          <Paragraph className="text-xs font-medium text-white/60">Handle</Paragraph>
          <div className="flex items-center rounded-md border border-white/20 bg-transparent text-sm text-white focus-within:border-white/50">
            <input
              value={handlePrefix}
              onChange={(e) => setHandlePrefix(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 placeholder:text-white/50 focus:outline-none"
              placeholder="user1"
            />
            {pdsBareHost && (
              <span className="shrink-0 pr-3 text-white/40">.{pdsBareHost}</span>
            )}
          </div>
        </label>

        <label className="space-y-1 md:col-span-2">
          <Paragraph className="text-xs font-medium text-white/60">
            Password
          </Paragraph>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50"
            placeholder="new account password"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={createAccount}
          disabled={createAccountDisabled}
          className={
            createAccountDisabled
              ? "rounded-full bg-emerald-400/10 border border-emerald-200/10 opacity-40 cursor-not-allowed"
              : "rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-medium"
          }
        >
          Create user
        </Button>
        <Button
          onClick={createSession}
          disabled={createSessionDisabled}
          className={
            createSessionDisabled
              ? "rounded-full bg-sky-400/10 border border-sky-200/10 opacity-40 cursor-not-allowed"
              : "rounded-full bg-sky-500 hover:bg-sky-400 text-neutral-950 font-medium"
          }
        >
          Login (create session)
        </Button>
      </div>

      {error && (
        <Paragraph className="text-sm text-rose-100 bg-rose-950/40 rounded p-3">
          {error}
        </Paragraph>
      )}

      {output && (
        <div className="space-y-2">
          <Paragraph className="text-xs font-medium text-white/60">Response</Paragraph>
          <pre className="max-h-64 overflow-auto rounded bg-neutral-900/90 p-3 text-xs text-neutral-100">
            {output?.emailUsed && (
              <Paragraph className="mb-2 text-xs text-white/70">
                Email used:{" "}
                <span className="font-mono">{output.emailUsed}</span>
              </Paragraph>
            )}
            {output?.accessJwt
              ? JSON.stringify(
                  {
                    ...output,
                    accessJwt: redactJwt(output.accessJwt),
                    refreshJwt: redactJwt(output.refreshJwt),
                  },
                  null,
                  2,
                )
              : JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
