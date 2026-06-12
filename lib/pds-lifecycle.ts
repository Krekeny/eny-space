// Lifecycle of a user's PDS after their subscription ends.
//
//   active                 PDS on, unlimited.
//     | cancel OR payment fails
//   grace                  PDS still on, dashboard read-only. The user can
//                          resubscribe to return to active. Lasts 14 days
//                          (cancellation) or 30 days (payment failed).
//     | grace period elapses
//     => Froxlor DELETE /service/{id} with termination_date = now + 30d.
//        This switches the PDS off (state 4) AND schedules the pod's hard
//        deletion 30 days out — a single infra call.
//   suspended              PDS off, but still recoverable: resubscribing
//                          returns the user to active. Lasts 30 days.
//     | 30 days with no action
//   deleted                Froxlor executes the scheduled termination; the pod
//                          is permanently gone.
//
// Only the final deletion is irreversible. Everything before it (grace +
// suspended) can be undone by resubscribing.

export type PdsLifecycleStatus = "active" | "grace" | "suspended" | "deleted";
export type PdsLifecycleReason = "canceled" | "past_due";

const DAY_MS = 24 * 60 * 60 * 1000;

// Days in the grace period (PDS on, read-only), per reason.
export const GRACE_DAYS: Record<PdsLifecycleReason, number> = {
  canceled: 14,
  past_due: 30,
};

// Days in the suspended period (PDS off, recoverable) before the pod is
// permanently deleted. Same for both reasons.
export const SUSPENDED_DAYS = 30;

/** End of the grace period (grace -> suspended). */
export function graceUntil(
  reason: PdsLifecycleReason,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + GRACE_DAYS[reason] * DAY_MS);
}

/**
 * Permanent pod-deletion time (suspended -> deleted), measured from the grace
 * end. This is also the `termination_date` passed to the Froxlor DELETE call.
 */
export function deleteAt(graceEnd: Date): Date {
  return new Date(graceEnd.getTime() + SUSPENDED_DAYS * DAY_MS);
}

/** Whether the user can still reach their PDS / dashboard. */
export function hasPdsAccess(status: PdsLifecycleStatus): boolean {
  return status === "active" || status === "grace";
}

/** The dashboard is read-only while in the grace period. */
export function isReadOnly(status: PdsLifecycleStatus): boolean {
  return status === "grace";
}
