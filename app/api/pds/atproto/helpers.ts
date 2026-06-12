import { createClient } from "@/lib/supabase/server";

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

