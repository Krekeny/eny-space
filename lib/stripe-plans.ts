import { stripe } from "@/lib/stripe";
import {
  normalizePlanKey,
  PLAN_KEYS,
  type PlanKey,
} from "@/lib/plan-keys";

export { normalizePlanKey, PLAN_KEYS, type PlanKey };

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

export function getPriceIdForPlan(planKey: string | undefined | null): string {
  const key = normalizePlanKey(planKey);
  return getEnvPriceId(key) || "";
}

/**
 * Reverse of getPriceIdForPlan: resolve which plan a Stripe Price ID belongs to.
 * Returns null if no per-plan env Price ID matches.
 */
export function getPlanKeyForPriceId(
  priceId: string | undefined | null,
): PlanKey | null {
  if (!priceId) return null;
  for (const key of PLAN_KEYS) {
    if (getEnvPriceId(key) === priceId) return key;
  }
  return null;
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
