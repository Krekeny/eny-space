import "server-only";

// Mutating infra calls are gated behind PDS_LIFECYCLE_ENABLED; while it is not
// "true" they log and no-op so the flow can be exercised without side effects.

const PDS_API_BASE_URL = process.env.PDS_API_BASE_URL;
const LIFECYCLE_ENABLED = process.env.PDS_LIFECYCLE_ENABLED === "true";

function requireConfig(): { baseUrl: string; token: string } {
  if (!PDS_API_BASE_URL) throw new Error("Missing PDS_API_BASE_URL env var");
  const token = process.env.PDS_API_TOKEN;
  if (!token) throw new Error("Missing PDS_API_TOKEN env var");
  return { baseUrl: PDS_API_BASE_URL, token };
}

// Full ISO 8601 datetime in UTC (e.g. 2026-06-23T14:02:00.000Z) — not a bare
// date, which the backend would read as 00:00 (in the past later in the day).
export function formatTerminationDate(date: Date): string {
  return date.toISOString();
}

/** Schedule a service for deletion (optionally on a given date; omitted = backend default). */
export async function schedulePdsTermination(
  serviceId: number,
  terminationDate?: Date,
): Promise<void> {
  // Never send a past date — the backend rejects "termination date must be
  // today or in the future". If the target is already in the past (a lagged
  // sweep, or a backdated test), clamp to now → delete today.
  let body: Record<string, string> = {};
  if (terminationDate) {
    const now = new Date();
    const when = terminationDate.getTime() > now.getTime() ? terminationDate : now;
    body = { termination_date: formatTerminationDate(when) };
  }

  if (!LIFECYCLE_ENABLED) {
    console.log(
      `[pds-infra] (disabled) would DELETE /service/${serviceId}`,
      body,
    );
    return;
  }

  const { baseUrl, token } = requireConfig();
  const url = `${baseUrl}/service/${serviceId}`;
  const requestBody = JSON.stringify(body);
  console.log(`[pds-infra] → DELETE ${url}  body=${requestBody}`);

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: requestBody,
  });

  const responseBody = await res.text().catch(() => "");
  console.log(
    `[pds-infra] ← DELETE /service/${serviceId} ${res.status} ${res.statusText} ` +
      `ct=${res.headers.get("content-type") ?? "?"}  body=${responseBody || "<empty>"}`,
  );

  if (!res.ok) {
    throw new Error(
      `PDS termination failed for service ${serviceId} (${res.status}): ${responseBody}`,
    );
  }
}

/** Cancel a scheduled termination so a resubscribing user keeps their data. */
export async function reactivatePdsService(serviceId: number): Promise<void> {
  if (!LIFECYCLE_ENABLED) {
    console.log(`[pds-infra] (disabled) would PATCH /service/${serviceId}`, {
      cancel_termination: true,
    });
    return;
  }

  const { baseUrl, token } = requireConfig();
  const res = await fetch(`${baseUrl}/service/${serviceId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cancel_termination: true }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `PDS reactivation failed for service ${serviceId} (${res.status}): ${detail}`,
    );
  }
}
