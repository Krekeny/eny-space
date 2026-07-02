"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GlobeIcon,
  TerminalIcon,
  SparklesIcon,
  ChevronDownIcon,
  AtSignIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
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

export function UserDashboardClient({
  readOnly = false,
  canInvite = true,
  maxAccounts = Infinity,
}: {
  readOnly?: boolean;
  canInvite?: boolean;
  maxAccounts?: number;
}) {
  const [pdsBareHost, setPdsBareHost] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<PdsAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "migrate" | "invite">("create");

  useEffect(() => {
    fetch("/api/pds/service")
      .then((r) => r.json())
      .then((data: ServiceResponse) => {
        const host = data?.hostname || data?.encrypted_config?.hostname || "";
        setPdsBareHost(stripScheme(host));
      })
      .catch((e) =>
        setFetchError(
          e instanceof Error ? e.message : "Failed to load PDS info",
        ),
      );
  }, []);

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const res = await fetch("/api/pds/atproto/accounts");
      const payload = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          `${payload?.message || "Failed to load accounts"} — ${JSON.stringify(payload?.upstream ?? {})}`,
        );
      setAccounts(payload?.accounts ?? []);
    } catch (e) {
      setAccountsError(e instanceof Error ? e.message : String(e));
    } finally {
      setAccountsLoading(false);
      setAccountsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  if (fetchError) {
    return <Paragraph className="text-sm text-rose-300">{fetchError}</Paragraph>;
  }

  const atLimit =
    Number.isFinite(maxAccounts) && accounts.length >= maxAccounts;
  const showCreate = !atLimit;

  return (
    <div className="space-y-6">
      {readOnly && (
        <Paragraph className="text-xs text-amber-300">
          Read-only: management actions are disabled while your subscription is
          inactive.
        </Paragraph>
      )}

      {accountsLoaded && showCreate && !readOnly && (
        <div className="space-y-4">
          <div className="inline-flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {(
              [
                { id: "create", label: "Create user" },
                { id: "migrate", label: "Migrate user" },
                ...(canInvite
                  ? [{ id: "invite", label: "Invite someone" }]
                  : []),
              ] as { id: "create" | "migrate" | "invite"; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  mode === tab.id
                    ? "bg-white text-neutral-950"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "create" && (
            <CreateUserSection
              pdsBareHost={pdsBareHost}
              readOnly={readOnly}
              onCreated={loadAccounts}
            />
          )}
          {mode === "migrate" && <MigrateSection pdsBareHost={pdsBareHost} />}
          {mode === "invite" && canInvite && (
            <InviteSection readOnly={readOnly} />
          )}
        </div>
      )}

      {accountsLoaded && atLimit && !canInvite && (
        <Paragraph className="text-xs text-white/50">
          Your plan supports a single account. We&apos;re working on plan
          upgrades, soon you&apos;ll be able to switch to the Community plan for
          more space and additional users.
        </Paragraph>
      )}

      <UsersSection
        accounts={accounts}
        loading={accountsLoading}
        error={accountsError}
        onRefresh={loadAccounts}
        readOnly={readOnly}
      />
    </div>
  );
}

function CreateUserSection({
  pdsBareHost,
  readOnly,
  onCreated,
}: {
  pdsBareHost: string;
  readOnly: boolean;
  onCreated: () => void;
}) {
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fullHandle = useMemo(
    () => (handle && pdsBareHost ? `${handle}.${pdsBareHost}` : ""),
    [handle, pdsBareHost],
  );

  // Strong, readable password (no ambiguous chars like 0/O/1/l/I).
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = new Uint32Array(16);
    crypto.getRandomValues(bytes);
    setPassword(Array.from(bytes, (n) => chars[n % chars.length]).join(""));
    setShowPassword(true);
  };

  const submit = async () => {
    if (!handle || !password) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiCall("/api/pds/atproto/create-account", {
        handle: fullHandle,
        password,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      setSuccess(`Account created: ${fullHandle}`);
      setHandle("");
      setEmail("");
      setPassword("");
      onCreated();
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
      <div className="space-y-3 max-w-sm">
        <div className="space-y-1">
          <Label htmlFor="handle">Handle</Label>
          <div className="group relative">
            <AtSignIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-fuchsia-400"
              aria-hidden
            />
            <Input
              id="handle"
              value={handle}
              onChange={(e) =>
                setHandle(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
              placeholder="username"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              className="h-10 pl-9 focus-visible:border-fuchsia-400/70 focus-visible:ring-fuchsia-400/30"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-email">
            Email <span className="font-normal text-white/40">(optional)</span>
          </Label>
          <div className="group relative">
            <MailIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-fuchsia-400"
              aria-hidden
            />
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="leave blank to auto-generate"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              className="h-10 pl-9 focus-visible:border-fuchsia-400/70 focus-visible:ring-fuchsia-400/30"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="new-password">Password</Label>
            <button
              type="button"
              onClick={generatePassword}
              className="inline-flex items-center gap-1 text-xs font-medium text-fuchsia-300/90 transition-colors hover:text-fuchsia-200"
            >
              <SparklesIcon className="size-3.5" aria-hidden />
              Generate
            </button>
          </div>
          <div className="group relative">
            <LockIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-fuchsia-400"
              aria-hidden
            />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              className="h-10 pl-9 pr-10 font-mono focus-visible:border-fuchsia-400/70 focus-visible:ring-fuchsia-400/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-fuchsia-300"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" aria-hidden />
              ) : (
                <EyeIcon className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>
      {pdsBareHost && (
        <Paragraph className="max-w-sm text-xs text-white/50 break-all">
          <span className="font-mono text-fuchsia-200/90">
            {handle || "username"}.{pdsBareHost}
          </span>{" "}
          will be created
        </Paragraph>
      )}
      <Button
        onClick={submit}
        disabled={loading || !handle || !password || !pdsBareHost || readOnly}
        className="w-full max-w-sm rounded-full bg-fuchsia-500 font-semibold text-white shadow-[0_0_24px_rgba(232,121,249,0.25)] transition-colors hover:bg-fuchsia-400 disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "Creating…" : "Create user"}
      </Button>
      {success && <Paragraph className="text-sm text-emerald-300">{success}</Paragraph>}
      {error && <Paragraph className="text-sm text-rose-300 break-all">{error}</Paragraph>}
    </section>
  );
}

function InviteSection({ readOnly }: { readOnly: boolean }) {
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
      <Button onClick={generate} disabled={loading || readOnly} className="rounded-full w-full">
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

function MigrateSection({ pdsBareHost }: { pdsBareHost: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCli, setShowCli] = useState(false);

  const host = pdsBareHost ? `https://${pdsBareHost}` : "https://<your-pds-host>";

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiCall("/api/pds/atproto/invite", { useCount: 1 });
      setCode(payload?.code || payload?.inviteCode || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-md border border-white/10 bg-white/5 p-4">
      <div>
        <Paragraph className="text-sm font-semibold text-white">
          Migrate an existing account
        </Paragraph>
        <Paragraph className="text-xs text-white/50 mt-1">
          Already have an AT Protocol account elsewhere? Move it here — you keep
          your DID and handle. Pick a method below.
        </Paragraph>
      </div>

      {/* What every method needs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Paragraph className="text-xs font-medium text-white/60">
            Destination PDS
          </Paragraph>
          <Paragraph className="font-mono text-xs text-white break-all rounded bg-black/20 p-2">
            {host}
          </Paragraph>
        </div>
        <div className="space-y-1">
          <Paragraph className="text-xs font-medium text-white/60">
            Migration code
          </Paragraph>
          {code ? (
            <Paragraph className="font-mono text-xs text-white break-all rounded bg-black/20 p-2">
              {code}
            </Paragraph>
          ) : (
            <Button
              onClick={generate}
              disabled={loading}
              className="h-9 w-full rounded-full text-xs"
            >
              {loading ? "Generating…" : "Generate code"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {/* 1. PDS MOOver — recommended */}
        <div className="flex items-start gap-3 rounded-md border border-emerald-400/30 bg-emerald-400/5 p-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
            <GlobeIcon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Paragraph className="text-sm font-semibold text-white">
                PDS MOOver (web)
              </Paragraph>
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                Recommended
              </span>
            </div>
            <Paragraph className="text-xs text-white/60">
              Migrate in your browser: log in with your current handle + app
              password, set the destination to the URL above, and paste the
              migration code when asked. Use a desktop and keep the tab open —
              blob uploads take 20–30 min.
            </Paragraph>
            <a
              href="https://pdsmoover.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
            >
              Open PDS MOOver ↗
            </a>
          </div>
        </div>

        {/* 2. goat CLI — collapsible (developer method) */}
        <div className="rounded-md border border-white/10 bg-white/5">
          <button
            type="button"
            onClick={() => setShowCli((s) => !s)}
            aria-expanded={showCli}
            className="flex w-full items-center gap-3 p-3 text-left"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
              <TerminalIcon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Paragraph className="text-sm font-semibold text-white">
                  Command line (goat)
                </Paragraph>
                <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-300">
                  Developer
                </span>
              </div>
              <Paragraph className="text-xs text-white/60">
                For power users — the official AT Protocol CLI.
              </Paragraph>
            </div>
            <ChevronDownIcon
              className={`size-4 shrink-0 text-white/40 transition-transform ${showCli ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {showCli && (
            <div className="px-3 pb-3">
              <pre className="overflow-auto rounded bg-neutral-900/90 p-3 text-[11px] leading-relaxed text-neutral-100">
{`# 1. Install goat
brew install goat
# or
go install github.com/bluesky-social/indigo/cmd/goat@latest

# 2. Log in to your CURRENT account (old provider)
goat account login -u <your-current-handle> -p <app-password>

# 3. Request a PLC token from your old PDS (authorizes the identity move)
goat account plc request-token

# 4. Check your email for the token, then migrate
goat account migrate \\
  --pds-host ${host} \\
  --invite-code ${code ?? "<generate a code above>"} \\
  --new-handle <your-handle> \\
  --new-password <your-new-secure-password> \\
  --new-email <your-email> \\
  --plc-token <THE-TOKEN-FROM-YOUR-EMAIL>

# 5. Activate the new account (REQUIRED — until you do this your
#    account stays deactivated and won't appear on Bluesky)
goat account activate`}
              </pre>
            </div>
          )}
        </div>

        {/* 3. Built-in — coming soon */}
        <div className="flex items-start gap-3 rounded-md border border-white/10 bg-white/5 p-3 opacity-70">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70">
            <SparklesIcon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Paragraph className="text-sm font-semibold text-white/80">
                Built-in migration
              </Paragraph>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
                Coming soon
              </span>
            </div>
            <Paragraph className="text-xs text-white/50">
              We&apos;re building guided migration right into eny.space — no
              external tools, all in one place.
            </Paragraph>
          </div>
        </div>
      </div>

      {error && (
        <Paragraph className="text-sm text-rose-300 break-all">{error}</Paragraph>
      )}
    </section>
  );
}

type PdsAccount = {
  did: string;
  handle: string;
  email?: string;
  indexedAt?: string;
  emailConfirmedAt?: string;
  deactivatedAt?: string;
};

function DeleteDialog({
  handle,
  onConfirm,
  onCancel,
  busy,
}: {
  handle: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [input, setInput] = useState("");
  const matches = input === handle;

  return (
    <div className="mt-2 space-y-3 rounded-md border border-rose-500/30 bg-rose-950/20 p-3 text-sm">
      <div className="space-y-1">
        <Paragraph className="font-medium text-rose-300">Delete {handle}?</Paragraph>
        <Paragraph className="text-xs text-white/50">
          All data is permanently and immediately deleted. This cannot be undone.
        </Paragraph>
      </div>
      <div className="space-y-1">
        <Paragraph className="text-xs text-white/50">Type the handle to confirm:</Paragraph>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={handle}
          className="h-7 text-xs"
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onConfirm}
          disabled={!matches || busy}
          className="h-7 rounded-full px-3 text-xs bg-rose-600 hover:bg-rose-500 border-0 flex-1"
        >
          {busy ? "Deleting…" : "Delete permanently"}
        </Button>
        <Button
          onClick={onCancel}
          disabled={busy}
          className="h-7 rounded-full px-3 text-xs bg-transparent border border-white/20 hover:bg-white/5"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function VerifyEmailInline({
  account,
  onVerified,
}: {
  account: PdsAccount;
  onVerified: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (action: "request" | "confirm") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pds/atproto/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: account.handle,
          password,
          action,
          token,
          email: account.email,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || "Request failed");
      if (action === "request") setCodeSent(true);
      else onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-amber-300/90 transition-colors hover:text-amber-200"
      >
        Verify email
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-white/10 bg-white/5 p-2.5">
      <Paragraph className="text-[11px] text-white/50">
        Verifying needs this account&apos;s password — email confirmation is
        account-scoped. We send a code to {account.email}, then you enter it.
      </Paragraph>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Account password"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        className="w-full rounded border border-white/15 bg-neutral-900/60 px-2 py-1 text-xs text-white placeholder:text-white/30"
      />
      {!codeSent ? (
        <button
          type="button"
          onClick={() => call("request")}
          disabled={busy || !password}
          className="text-xs font-medium text-fuchsia-300/90 transition-colors hover:text-fuchsia-200 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send code"}
        </button>
      ) : (
        <>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Code from email"
            className="w-full rounded border border-white/15 bg-neutral-900/60 px-2 py-1 text-xs text-white placeholder:text-white/30"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => call("confirm")}
              disabled={busy || !token}
              className="text-xs font-medium text-emerald-300/90 transition-colors hover:text-emerald-200 disabled:opacity-50"
            >
              {busy ? "Confirming…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => call("request")}
              disabled={busy}
              className="text-xs text-white/40 transition-colors hover:text-white/70 disabled:opacity-50"
            >
              Resend
            </button>
          </div>
        </>
      )}
      {error && (
        <Paragraph className="text-[11px] text-rose-300 break-all">
          {error}
        </Paragraph>
      )}
    </div>
  );
}

function AccountRow({
  account,
  onRefresh,
  readOnly,
}: {
  account: PdsAccount;
  onRefresh: () => void;
  readOnly: boolean;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [resetState, setResetState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const sendReset = async () => {
    if (!account.email) return;
    setResetState("sending");
    setRowError(null);
    try {
      const res = await fetch("/api/pds/atproto/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || "Failed to send reset");
      setResetState("sent");
    } catch (e) {
      setResetState("error");
      setRowError(e instanceof Error ? e.message : String(e));
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    setRowError(null);
    try {
      const res = await fetch("/api/pds/atproto/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ did: account.did }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || "Failed to delete account");
      onRefresh();
    } catch (e) {
      setRowError(e instanceof Error ? e.message : String(e));
      setShowDeleteDialog(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="py-3 text-sm space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="group flex items-center gap-1.5 min-w-0 text-left"
              aria-expanded={open}
            >
              <ChevronDownIcon
                className={`size-3.5 shrink-0 text-white/40 transition group-hover:text-white/80 ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
              <Paragraph className="font-medium text-white truncate transition-colors group-hover:text-white/80">
                {account.handle}
              </Paragraph>
            </button>
            <a
              href={`https://pdsls.dev/at://${account.did}`}
              target="_blank"
              rel="noreferrer"
              title="View on PDSls"
              className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/atmosphere-icons/logo-pdsls.svg"
                alt="View on PDSls"
                className="size-4"
              />
            </a>
          </div>

          {open && (
            <dl className="mt-2 ml-5 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-xs text-white/70">
              <dt className="text-white/40">Email</dt>
              <dd className="break-all">
                {account.email ?? "—"}
                {account.email && !account.emailConfirmedAt && (
                  <span className="ml-1 text-amber-300/80">(unconfirmed)</span>
                )}
              </dd>
              <dt className="text-white/40">DID</dt>
              <dd className="font-mono break-all">{account.did}</dd>
              <dt className="text-white/40">Created</dt>
              <dd>
                {account.indexedAt
                  ? new Date(account.indexedAt).toLocaleString()
                  : "—"}
              </dd>
              <dt className="text-white/40">Status</dt>
              <dd>
                {account.deactivatedAt ? (
                  <span className="text-rose-300">deactivated</span>
                ) : (
                  <span className="text-emerald-300">active</span>
                )}
              </dd>
            </dl>
          )}
          {open && !readOnly && account.email && (
            <div className="mt-2 ml-5">
              <button
                type="button"
                onClick={sendReset}
                disabled={resetState === "sending" || resetState === "sent"}
                className="text-xs font-medium text-fuchsia-300/90 transition-colors hover:text-fuchsia-200 disabled:opacity-50"
              >
                {resetState === "sending"
                  ? "Sending…"
                  : resetState === "sent"
                    ? "Reset email sent ✓"
                    : "Send password reset"}
              </button>
            </div>
          )}
          {open && !readOnly && account.email && !account.emailConfirmedAt && (
            <div className="mt-2 ml-5">
              <VerifyEmailInline account={account} onVerified={onRefresh} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {account.indexedAt && (
            <Paragraph className="text-xs text-white/40 whitespace-nowrap">
              {new Date(account.indexedAt).toLocaleDateString()}
            </Paragraph>
          )}
          {!readOnly && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={busy || showDeleteDialog}
              className="text-xs text-white/40 hover:text-rose-400 transition-colors disabled:opacity-40"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      {showDeleteDialog && (
        <DeleteDialog
          handle={account.handle}
          onConfirm={deleteAccount}
          onCancel={() => setShowDeleteDialog(false)}
          busy={busy}
        />
      )}
      {rowError && (
        <Paragraph className="text-xs text-rose-300 break-all">{rowError}</Paragraph>
      )}
    </div>
  );
}

function UsersSection({
  accounts,
  loading,
  error,
  onRefresh,
  readOnly,
}: {
  accounts: PdsAccount[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  readOnly: boolean;
}) {
  // Only reflect the (client-only) loading state after mount, so the server
  // HTML and the first client render agree — avoids a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const busy = mounted && loading;

  return (
    <section className="space-y-3 rounded-md border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <Paragraph className="text-sm font-semibold text-white">Users</Paragraph>
        <button
          onClick={onRefresh}
          disabled={busy}
          className="text-xs text-white/40 hover:text-white/80 transition-colors disabled:opacity-40"
        >
          {busy ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <Paragraph className="text-sm text-rose-300">{error}</Paragraph>
      )}

      {mounted && !loading && !error && accounts.length === 0 && (
        <Paragraph className="text-sm text-white/40">No accounts found.</Paragraph>
      )}

      {accounts.length > 0 && (
        <div className="divide-y divide-white/5">
          {accounts.map((account) => (
            <AccountRow
              key={account.did}
              account={account}
              onRefresh={onRefresh}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </section>
  );
}
