// Post-subscription PDS lifecycle. Only deletion is irreversible.

export type PdsLifecycleStatus = "active" | "grace" | "suspended" | "deleted";
export type PdsLifecycleReason = "canceled" | "past_due";

const DAY_MS = 24 * 60 * 60 * 1000;

// Length of one lifecycle "unit" (default 1 day). Override with
// PDS_LIFECYCLE_UNIT_MS to compress the flow for testing.
function unitMs(): number {
  const raw = process.env.PDS_LIFECYCLE_UNIT_MS;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DAY_MS;
}

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const GRACE_UNITS: Record<PdsLifecycleReason, number> = {
  canceled: envInt("PDS_GRACE_UNITS_CANCELED", 14),
  past_due: envInt("PDS_GRACE_UNITS_PAST_DUE", 30),
};

export const SUSPENDED_UNITS = envInt("PDS_SUSPENDED_UNITS", 30);

export function graceUntil(
  reason: PdsLifecycleReason,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + GRACE_UNITS[reason] * unitMs());
}

export function deleteAt(graceEnd: Date): Date {
  return new Date(graceEnd.getTime() + SUSPENDED_UNITS * unitMs());
}

export function startLifecycle(
  reason: PdsLifecycleReason,
  from: Date = new Date(),
): { graceUntil: Date; deleteAt: Date } {
  const grace = graceUntil(reason, from);
  return { graceUntil: grace, deleteAt: deleteAt(grace) };
}

/** Resolve the current phase from the persisted status + timestamps. */
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

/**
 * Master switch. When not exactly "true", NO lifecycle state changes happen
 */
export function lifecycleEnabled(): boolean {
  return process.env.PDS_LIFECYCLE_ENABLED === "true";
}
