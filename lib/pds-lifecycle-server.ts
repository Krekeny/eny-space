import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  startLifecycle,
  effectiveLifecycle,
  type PdsLifecycleReason,
  type PdsLifecycleStatus,
} from "@/lib/pds-lifecycle";
import {
  schedulePdsTermination,
  reactivatePdsService,
} from "@/lib/pds-infra";

// Server-side lifecycle mutations, shared by the webhook, the cron sweep, and
// the dev control panel so the behavior can't diverge.

type Admin = ReturnType<typeof createAdminClient>;

const ROW_FIELDS =
  "user_id, pds_service_id, lifecycle_status, lifecycle_reason, grace_until, delete_at";

async function getRow(supabase: Admin, userId: string) {
  const { data } = await supabase
    .from("pds_services")
    .select(ROW_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

/** Map a Stripe customer id to a user id (via the subscriptions table). */
export async function userIdForCustomer(
  customerId: string,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}

/** Read the current lifecycle row for a user. */
export async function getLifecycle(userId: string) {
  return getRow(createAdminClient(), userId);
}

/**
 * Begin the grace period (cancel or payment failure): persist the timestamps
 * and schedule the infra termination at the grace end. No-op if a lifecycle is
 * already in progress, so a later event can't override an in-flight grace.
 */
export async function startPdsGrace(
  userId: string,
  reason: PdsLifecycleReason,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = createAdminClient();
  const row = await getRow(supabase, userId);
  if (!row) return { ok: false, message: "No PDS for this user" };
  if (row.lifecycle_status && row.lifecycle_status !== "active") {
    return { ok: false, message: `Already ${row.lifecycle_status}` };
  }

  const { graceUntil, deleteAt } = startLifecycle(reason);
  await supabase
    .from("pds_services")
    .update({
      lifecycle_status: "grace",
      lifecycle_reason: reason,
      grace_until: graceUntil.toISOString(),
      delete_at: deleteAt.toISOString(),
    })
    .eq("user_id", userId);

  console.log(
    `[lifecycle] grace started (${reason}) for ${userId}: grace_until=${graceUntil.toISOString()} delete_at=${deleteAt.toISOString()}`,
  );

  if (row.pds_service_id) {
    try {
      await schedulePdsTermination(Number(row.pds_service_id), graceUntil);
    } catch (e) {
      console.error("[lifecycle] schedulePdsTermination failed", e);
    }
  }
  return { ok: true };
}

/** Recover a PDS to active (resubscribe / payment recovered). */
export async function reactivatePds(
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = createAdminClient();
  const row = await getRow(supabase, userId);
  if (!row || !row.lifecycle_status || row.lifecycle_status === "active") {
    return { ok: false, message: "Not in a lifecycle" };
  }

  await supabase
    .from("pds_services")
    .update({
      lifecycle_status: "active",
      lifecycle_reason: null,
      grace_until: null,
      delete_at: null,
    })
    .eq("user_id", userId);

  console.log(`[lifecycle] reactivated PDS for ${userId}`);

  if (row.pds_service_id) {
    try {
      await reactivatePdsService(Number(row.pds_service_id));
    } catch (e) {
      console.error("[lifecycle] reactivatePdsService failed", e);
    }
  }
  return { ok: true };
}

/** Hard-reset lifecycle fields to active (test cleanup; no infra call). */
export async function resetPdsLifecycle(userId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("pds_services")
    .update({
      lifecycle_status: "active",
      lifecycle_reason: null,
      grace_until: null,
      delete_at: null,
    })
    .eq("user_id", userId);
  return { ok: true };
}

/** Advance grace -> suspended -> deleted labels for all in-progress rows. */
export async function sweepLifecycles() {
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("pds_services")
    .select("user_id, lifecycle_status, grace_until, delete_at")
    .in("lifecycle_status", ["grace", "suspended"]);
  if (error) throw error;

  const now = new Date();
  const transitions: Array<{ user_id: string; from: string; to: string }> = [];

  for (const row of rows ?? []) {
    const status = (row.lifecycle_status ?? "active") as PdsLifecycleStatus;
    const next = effectiveLifecycle({
      status,
      graceUntil: row.grace_until ? new Date(row.grace_until) : null,
      deleteAt: row.delete_at ? new Date(row.delete_at) : null,
      now,
    });
    if (next !== status) {
      await supabase
        .from("pds_services")
        .update({ lifecycle_status: next })
        .eq("user_id", row.user_id);
      console.log(`[lifecycle] ${row.user_id}: ${status} -> ${next}`);
      transitions.push({ user_id: row.user_id, from: status, to: next });
    }
  }

  return { scanned: rows?.length ?? 0, transitions };
}
