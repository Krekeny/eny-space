// Lifecycle of a user's PDS after their subscription ends.
//
//   active                 PDS on, unlimited.
//     | cancel OR payment fails
//   grace                  PDS still on, dashboard read-only. The user can
//                          resubscribe to return to active. Lasts 14 days
//                          (cancellation) or 30 days (payment failed).
//     | grace period elapses
//     => Froxlor DELETE /service/{id} with termination_date = grace end.
//        The service runs until then, is suspended (off) at that date, and the
//        pod is permanently deleted ~30 days later — a single infra call made
//        up front (we already know the schedule).
//   suspended              PDS off, but still recoverable: resubscribing
//                          returns the user to active. Lasts 30 days.
//     | 30 days with no action
//   deleted                The pod is permanently gone.
//
// Only the final deletion is irreversible. Everything before it (grace +
// suspended) can be undone by resubscribing.

export type PdsLifecycleStatus = "active" | "grace" | "suspended" | "deleted";
export type PdsLifecycleReason = "canceled" | "past_due";

const DAY_MS = 24 * 60 * 60 * 1000;

// Length of one lifecycle "unit". Defaults to a day; override with
// PDS_LIFECYCLE_UNIT_MS (e.g. 60000 = 1 minute) to compress the whole flow for
// testing without changing the 14/30/30 counts below.
function unitMs(): number {
  const raw = process.env.PDS_LIFECYCLE_UNIT_MS;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DAY_MS;
}

// Units in the grace period (PDS on, read-only), per reason.
export const GRACE_UNITS: Record<PdsLifecycleReason, number> = {
  canceled: 14,
  past_due: 30,
};

// Units in the suspended period (PDS off, recoverable) before permanent
// deletion. Same for both reasons.
export const SUSPENDED_UNITS = 30;

/** End of the grace period (grace -> suspended). */
export function graceUntil(
  reason: PdsLifecycleReason,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + GRACE_UNITS[reason] * unitMs());
}

/**
 * Permanent pod-deletion time (suspended -> deleted), measured from the grace
 * end. Also the `termination_date` + retention window handled by the backend.
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
 * access gating stays correct even if the scheduler hasn't run yet.
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

/** Whether the user can still reach their PDS / dashboard. */
export function hasPdsAccess(status: PdsLifecycleStatus): boolean {
  return status === "active" || status === "grace";
}

/** The dashboard is read-only while in the grace period. */
export function isReadOnly(status: PdsLifecycleStatus): boolean {
  return status === "grace";
}
