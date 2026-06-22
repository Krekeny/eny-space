// Lifecycle of a user's PDS after their subscription ends.
//
//   active     PDS on, unlimited. (A scheduled cancellation runs here until the
//              paid period ends — still full access.)
//     | subscription actually ends (period end) OR payment fails
//   grace      PDS STAYS ON and reachable, dashboard read-only. Same backend
//              state (running) — no infra call yet. Resubscribe → active.
//              Lasts 14 days (cancellation) or 30 days (payment failed).
//     | grace window elapses
//     => DELETE /service/{id} with termination_date = now + 30 days.
//        The backend takes the pod DOWN now and keeps the data for 30 days.
//   suspended  PDS OFF, data retained, recoverable: resubscribing restores it
//              (PUT cancel_termination → pod back on with data). Lasts 30 days.
//     | termination_date reached
//   deleted    The pod + data are permanently gone.
//
// Only the final deletion is irreversible; grace + suspended both restore on
// resubscribe. NOTE: the grace→suspended DELETE is fired by the sweep job, so
// the lifecycle cron must run for cancellations to ever actually take the pod
// down / get deleted.

export type PdsLifecycleStatus = "active" | "grace" | "suspended" | "deleted";
export type PdsLifecycleReason = "canceled" | "past_due";

const DAY_MS = 24 * 60 * 60 * 1000;

// Length of one lifecycle "unit". Defaults to a day; override with
// PDS_LIFECYCLE_UNIT_MS (e.g. 60000 = 1 minute) to compress the whole flow for
// testing without changing the counts below.
function unitMs(): number {
  const raw = process.env.PDS_LIFECYCLE_UNIT_MS;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DAY_MS;
}

// Grace: PDS ON + reachable (read-only), per reason. No infra call during this.
export const GRACE_UNITS: Record<PdsLifecycleReason, number> = {
  canceled: 14,
  past_due: 30,
};

// Suspended: PDS OFF but data retained + recoverable, before permanent
// deletion. This is the `termination_date` window the backend honours.
export const SUSPENDED_UNITS = 30;

/** End of the grace period (grace -> suspended; when we fire the DELETE). */
export function graceUntil(
  reason: PdsLifecycleReason,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + GRACE_UNITS[reason] * unitMs());
}

/**
 * Permanent deletion time (suspended -> deleted), measured from grace end.
 * This is the `termination_date` we pass to DELETE at the grace→suspended step.
 */
export function deleteAt(graceEnd: Date): Date {
  return new Date(graceEnd.getTime() + SUSPENDED_UNITS * unitMs());
}

/** Compute both timestamps when a lifecycle starts (on cancel / payment fail). */
export function startLifecycle(
  reason: PdsLifecycleReason,
  from: Date = new Date(),
): { graceUntil: Date; deleteAt: Date } {
  const grace = graceUntil(reason, from);
  return { graceUntil: grace, deleteAt: deleteAt(grace) };
}

/**
 * Resolve the *current* phase from the persisted status and timestamps, so
 * gating stays correct even if the sweep hasn't run yet.
 */
export function effectiveLifecycle(input: {
  status: PdsLifecycleStatus;
  graceUntil: Date | null;
  deleteAt: Date | null;
  now?: Date;
}): PdsLifecycleStatus {
  const now = input.now ?? new Date();
  if (input.status === "active") return "active";
  if (!input.graceUntil || !input.deleteAt) return input.status;
  if (now < input.graceUntil) return "grace";
  if (now < input.deleteAt) return "suspended";
  return "deleted";
}

/** Whether the user can still reach their PDS / dashboard (read-only in grace). */
export function hasPdsAccess(status: PdsLifecycleStatus): boolean {
  return status === "active" || status === "grace";
}

/** The dashboard is read-only while in the grace period. */
export function isReadOnly(status: PdsLifecycleStatus): boolean {
  return status === "grace";
}
