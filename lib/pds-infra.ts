import "server-only";

// Client for mutating a PDS on the infrastructure provider (Froxlor / Laravel
// backend). Used by the subscription-lifecycle flow.
//
// SAFETY: every mutating call is gated behind PDS_LIFECYCLE_ENABLED. While that
// is not "true" the functions only log the intended request and no-op, so the
// webhook/cron can be exercised end-to-end without touching live services.

const PDS_API_BASE_URL = process.env.PDS_API_BASE_URL;
const LIFECYCLE_ENABLED = process.env.PDS_LIFECYCLE_ENABLED === "true";

function requireConfig(): { baseUrl: string; token: string } {
  if (!PDS_API_BASE_URL) throw new Error("Missing PDS_API_BASE_URL env var");
  const token = process.env.PDS_API_TOKEN;
  if (!token) throw new Error("Missing PDS_API_TOKEN env var");
  return { baseUrl: PDS_API_BASE_URL, token };
}

/**
 * Format a date for the backend `termination_date` field.
 *
 * The backend types this as a Laravel `date`, so we send `YYYY-MM-DD`.
 * (If they ever need time-of-day precision, switch to `date.toISOString()`
 * for a full ISO 8601 datetime.)
 */
export function formatTerminationDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/**
 * Flag a service for suspension + scheduled deletion.
 *
 * Calls `DELETE /service/{id}` with `termination_date`. Per the backend: the
 * service keeps running until `terminationDate`, then is suspended, and the pod
 * is permanently deleted ~30 days after that. Passing no date means "now".
 */
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
}

/**
 * PLACEHOLDER — reactivate a service whose termination was scheduled, so a
 * resubscribing user gets their PDS back with no data loss.
 *
 * The backend endpoint for this does not exist yet (to be implemented in their
 * Laravel service). The shape below is an ASSUMPTION — adjust the method/path/
 * body once the real endpoint is known. Likely candidates:
 *   - POST   /service/{id}/reactivate        (clear termination, turn back on)
 *   - PATCH  /service/{id}  { termination_date: null }
 *   - POST   /service/{id}/restore
 */
export async function reactivatePdsService(serviceId: number): Promise<void> {
  if (!LIFECYCLE_ENABLED) {
    console.log(
      `[pds-infra] (disabled) would reactivate /service/${serviceId}`,
    );
    return;
  }

  const { baseUrl, token } = requireConfig();

  // TODO: replace with the real reactivation endpoint once the Laravel backend
  // implements it. Assumed: POST /service/{id}/reactivate clears the scheduled
  // termination and brings the service back to a running (active) state.
  const res = await fetch(`${baseUrl}/service/${serviceId}/reactivate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `PDS reactivation failed for service ${serviceId} (${res.status}): ${detail}`,
    );
  }
}
