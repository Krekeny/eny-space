import { createClient } from "@/lib/supabase/server";
import type { PlanCatalogEntry } from "@/lib/plan-catalog";

const PDS_API_BASE_URL = process.env.PDS_API_BASE_URL;

function parseMaybeDoubleEncodedJson(input: unknown) {
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }
  return input;
}

export async function getPdsServiceForCurrentUser(): Promise<{
  pdsServiceId: number;
  service: any;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Promise.reject(Object.assign(new Error("Unauthorized"), { status: 401 }));
  }

  const { data: pdsServiceRow } = await supabase
    .from("pds_services")
    .select("pds_service_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const pdsServiceId = pdsServiceRow?.pds_service_id as
    | number
    | null
    | undefined;

  if (!pdsServiceId) {
    return Promise.reject(
      Object.assign(new Error("No provisioned PDS found for this user"), { status: 404 }),
    );
  }

  if (!PDS_API_BASE_URL) {
    return Promise.reject(
      Object.assign(new Error("Missing PDS_API_BASE_URL env var"), { status: 500 }),
    );
  }

  const apiToken = process.env.PDS_API_TOKEN;
  if (!apiToken) {
    return Promise.reject(
      Object.assign(new Error("Missing PDS_API_TOKEN env var"), { status: 500 }),
    );
  }

  const res = await fetch(`${PDS_API_BASE_URL}/service/${pdsServiceId}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Authorization: `Bearer ${apiToken}`,
    },
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => "");
    }
    return Promise.reject(
      Object.assign(
        new Error(`Upstream PDS service fetch failed (${res.status})`),
        { status: 502, body: parseMaybeDoubleEncodedJson(body), contentType },
      ),
    );
  }

  if (!contentType.includes("application/json")) {
    return Promise.reject(
      Object.assign(new Error("Upstream did not return JSON"), { status: 502 }),
    );
  }

  const dataRaw: unknown = await res.json();
  const service = parseMaybeDoubleEncodedJson(dataRaw);

  return { pdsServiceId: Number(pdsServiceId), service };
}

export function getPdsBaseUrlFromService(service: any): string {
  const raw = (service?.hostname || service?.encrypted_config?.hostname) as string | undefined;
  if (!raw) {
    throw new Error("Missing PDS host");
  }

  // Backend might return either `https://host` or just `host`.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

function toBasicAuth(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

/**
 * Resolve the PDS base URL and an admin Basic-auth header from a service record.
 * Throws a status-tagged error (handled by the route catch blocks) when the
 * admin credentials are missing.
 */
export function getPdsAdminAuth(service: any): {
  pdsBaseUrl: string;
  authHeader: string;
} {
  const adminPassword = service?.encrypted_config?.adminPassword as
    | string
    | undefined;
  if (!adminPassword) {
    throw Object.assign(new Error("Missing PDS admin credentials"), {
      status: 500,
    });
  }
  return {
    pdsBaseUrl: getPdsBaseUrlFromService(service),
    authHeader: toBasicAuth("admin", String(adminPassword).trim()),
  };
}

/** Count the ATProto accounts hosted on a PDS (public listRepos endpoint). */
export async function countPdsAccounts(pdsBaseUrl: string): Promise<number> {
  const url = new URL(`${pdsBaseUrl}/xrpc/com.atproto.sync.listRepos`);
  url.searchParams.set("limit", "100");
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw Object.assign(new Error("Could not verify current account count"), {
      status: 502,
    });
  }
  const data = (await res.json().catch(() => ({}))) as { repos?: unknown[] };
  return Array.isArray(data?.repos) ? data.repos.length : 0;
}

/**
 * Uses still available on the PDS's live (non-disabled) admin invite codes.
 * These are pending accounts — counting them stops a finite plan from minting
 * several codes that together exceed the limit. Fails closed (throws) if the
 * count can't be read, so we never over-issue.
 */
async function outstandingInviteUses(
  pdsBaseUrl: string,
  authHeader: string,
): Promise<number> {
  const url = new URL(`${pdsBaseUrl}/xrpc/com.atproto.admin.getInviteCodes`);
  url.searchParams.set("sort", "recent");
  url.searchParams.set("limit", "100");
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: authHeader },
  });
  if (!res.ok) {
    throw Object.assign(new Error("Could not verify invite capacity"), {
      status: 502,
    });
  }
  const data = (await res.json().catch(() => ({}))) as {
    codes?: { available?: number; disabled?: boolean; uses?: unknown[] }[];
  };
  return (data.codes ?? []).reduce((sum, c) => {
    if (c.disabled) return sum;
    const used = Array.isArray(c.uses) ? c.uses.length : 0;
    const available = typeof c.available === "number" ? c.available : 0;
    return sum + Math.max(0, available - used);
  }, 0);
}

/**
 * Remaining account slots for a plan = maxAccounts minus accounts already
 * created minus pending invite uses. Infinity for unlimited plans.
 */
export async function remainingAccountSlots(
  pdsBaseUrl: string,
  authHeader: string,
  plan: PlanCatalogEntry,
): Promise<number> {
  if (!Number.isFinite(plan.maxAccounts)) return Infinity;
  const accounts = await countPdsAccounts(pdsBaseUrl);
  let pending = 0;
  try {
    pending = await outstandingInviteUses(pdsBaseUrl, authHeader);
  } catch (e) {
    // getInviteCodes unsupported/unreachable: degrade to account-count only.
    // The arbitrary-useCount exploit is still closed (grant is clamped to the
    // remaining slots); only the narrow "several unconsumed single-use codes"
    // gap stays open. Log it so the gap is visible rather than silent.
    console.warn(
      "[pds] outstanding-invite check failed; clamping by account count only",
      e,
    );
  }
  return Math.max(0, plan.maxAccounts - accounts - pending);
}

/**
 * Enforce a plan's account limit before creating/onboarding another account.
 * Throws a status-tagged 403 error (handled by route catch blocks) when full.
 */
export async function assertCanAddAccount(
  pdsBaseUrl: string,
  authHeader: string,
  plan: PlanCatalogEntry,
): Promise<void> {
  const remaining = await remainingAccountSlots(pdsBaseUrl, authHeader, plan);
  if (remaining <= 0) {
    throw Object.assign(
      new Error(
        `Your ${plan.name} plan allows ${plan.maxAccounts} account${
          plan.maxAccounts === 1 ? "" : "s"
        }. Upgrade to host more.`,
      ),
      { status: 403 },
    );
  }
}

