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

export function formatTerminationDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/** Schedule a service for deletion (optionally on a given date; omitted = backend default). */
export async function schedulePdsTermination(
  serviceId: number,
  terminationDate?: Date,
): Promise<void> {
  const body = terminationDate
    ? { termination_date: formatTerminationDate(terminationDate) }
    : {};

  if (!LIFECYCLE_ENABLED) {
    console.log(
      `[pds-infra] (disabled) would DELETE /service/${serviceId}`,
      body,
    );
    return;
  }

  const { baseUrl, token } = requireConfig();
  console.log(
    `[pds-infra] DELETE /service/${serviceId} — flagging pod for termination`,
    body,
  );
  const res = await fetch(`${baseUrl}/service/${serviceId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `PDS termination failed for service ${serviceId} (${res.status}): ${detail}`,
    );
  }
  console.log(
    `[pds-infra] ✅ service ${serviceId} flagged for termination (${res.status})`,
  );
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
