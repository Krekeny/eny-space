import { stripe } from "@/lib/stripe";

/** Matches Stripe product names: Personal, Community, Business */
export const PLAN_KEYS = ["personal", "community", "business"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

/** Old query-param keys → current plan keys (backwards compatibility). */
const LEGACY_PLAN_KEYS: Record<string, PlanKey> = {
  starter: "personal",
  growth: "community",
  pro: "business",
};

function getDefaultFallbackPriceId(): string | null {
  const fallback = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  return fallback && fallback.trim().length ? fallback : null;
}

function getEnvPriceId(planKey: PlanKey): string | null {
  const fallback = getDefaultFallbackPriceId();

  const map: Record<PlanKey, string | undefined> = {
    personal: process.env.NEXT_PUBLIC_STRIPE_PRICE_PERSONAL_ID,
    community: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY_ID,
    business: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ID,
  };

  return (map[planKey] && map[planKey]!.trim().length ? map[planKey]! : fallback) ?? null;
}

function normalizePlanKey(planKey: string | undefined | null): PlanKey {
  const raw = (planKey || "personal").toLowerCase();
  const fromLegacy = LEGACY_PLAN_KEYS[raw];
  const candidate = fromLegacy ?? raw;
  return (PLAN_KEYS as readonly string[]).includes(candidate)
    ? (candidate as PlanKey)
    : "personal";
}

export function getPriceIdForPlan(planKey: string | undefined | null): string {
  const key = normalizePlanKey(planKey);
  return getEnvPriceId(key) || "";
}

type StripePriceAmount = {
  priceId: string;
  unitAmount: number | null;
  currency: string | null;
};

async function retrievePriceById(priceId: string): Promise<StripePriceAmount> {
  const price = await stripe.prices.retrieve(priceId);
  return {
    priceId,
    unitAmount: price.unit_amount ?? null,
    currency: price.currency ?? null,
  };
}

/**
 * Fetch amounts for each plan from Stripe (using Price IDs from env).
 *
 * Note: this is server-side only; it never exposes Stripe secrets to the client.
 */
export async function getStripePlanAmounts(): Promise<
  Record<PlanKey, StripePriceAmount>
> {
  const results = {} as Record<PlanKey, StripePriceAmount>;

  await Promise.all(
    PLAN_KEYS.map(async (planKey) => {
      const priceId = getEnvPriceId(planKey);

      if (!priceId) {
        results[planKey] = { priceId: "", unitAmount: null, currency: null };
        return;
      }

      results[planKey] = await retrievePriceById(priceId);
    }),
  );

  return results;
}
