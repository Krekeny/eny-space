/** Plan identifiers shared by pricing UI and server-side Stripe helpers. */

export const PLAN_KEYS = ["personal", "community", "business"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

const LEGACY_PLAN_KEYS: Record<string, PlanKey> = {
  starter: "personal",
  growth: "community",
  pro: "business",
};

export function normalizePlanKey(planKey: string | undefined | null): PlanKey {
  const raw = (planKey || "personal").toLowerCase();
  const fromLegacy = LEGACY_PLAN_KEYS[raw];
  const candidate = fromLegacy ?? raw;
  return (PLAN_KEYS as readonly string[]).includes(candidate)
    ? (candidate as PlanKey)
    : "personal";
}
