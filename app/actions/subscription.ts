"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type { Stripe } from "stripe";
import { pdsHostnameForSlug, validatePdsSlugInput } from "@/lib/pds-slug";
import { welcomeNamePath } from "@/lib/onboarding";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";
import { getPriceIdForPlan } from "@/lib/stripe-plans";

/**
 * Get user's Stripe customer ID from database (minimal storage)
 */
async function getStripeCustomerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return subscription?.stripe_customer_id || null;
}

/**
 * Get active subscription directly from Stripe (source of truth)
 */
export async function getActiveSubscription(): Promise<Stripe.Subscription | null> {
  const customerId = await getStripeCustomerId();
  if (!customerId) {
    return null;
  }

  try {
    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    // Find active or trialing subscription (still counts as subscribed even if cancel_at_period_end)
    const activeSubscription = subscriptions.data.find(
      (sub) =>
        sub.status === "active" || sub.status === "trialing"
    );

    return activeSubscription || null;
  } catch (error) {
    console.error("Error fetching subscription from Stripe:", error);
    return null;
  }
}

/**
 * Get latest subscription for UI (shows canceled history too)
 */
export async function getSubscriptionStatus() {
  const customerId = await getStripeCustomerId();
  if (!customerId) {
    return {
      subscribed: false,
      active: false,
      subscription: null,
    };
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    if (!subscriptions.data.length) {
      return {
        subscribed: false,
        active: false,
        subscription: null,
      };
    }

    // Pick the most recently created subscription
    const latest = subscriptions.data.reduce<Stripe.Subscription | null>(
      (acc, sub) => {
        if (!acc) return sub;
        return sub.created > acc.created ? sub : acc;
      },
      null
    );

    if (!latest) {
      return {
        subscribed: false,
        active: false,
        subscription: null,
      };
    }

    const isActiveOrTrialing =
      latest.status === "active" || latest.status === "trialing";

    // "subscribed" = fully subscribed and not scheduled to cancel.
    // "active" = still has access right now, including when set to cancel at
    // period end. Use "active" for access gates so a cancellation only takes
    // effect once the paid period actually ends.
    const isCurrentlySubscribed =
      isActiveOrTrialing && latest.cancel_at_period_end === false;

    return {
      subscribed: isCurrentlySubscribed,
      active: isActiveOrTrialing,
      subscription: {
        status: latest.status,
        cancel_at_period_end: latest.cancel_at_period_end,
        current_period_end: new Date(
          latest.current_period_end * 1000
        ).toISOString(),
        current_period_start: new Date(
          latest.current_period_start * 1000
        ).toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching subscription status from Stripe:", error);
    return {
      subscribed: false,
      active: false,
      subscription: null,
    };
  }
}

/**
 * Verify active subscription for protected routes (always checks Stripe)
 */
export async function verifyActiveSubscription(): Promise<{
  active: boolean;
  subscription: Stripe.Subscription | null;
}> {
  const subscription = await getActiveSubscription();

  return {
    active: !!subscription,
    subscription,
  };
}

/**
 * Create checkout session for new subscription.
 * planKey and username come from the client; all pricing and config is
 * derived server-side from the plan catalog so the client cannot influence specs.
 */
export async function createSubscriptionCheckout(
  planKey: string,
  username: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated");
  }

  const rawUsername = username.trim();
  if (!rawUsername) {
    throw new Error("PDS name is required before checkout.");
  }

  const validation = validatePdsSlugInput(rawUsername);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const pdsUsername = validation.slug;

  // All plan config (price, disk size) comes from the server-side catalog
  const plan = getPlanCatalogEntry(planKey);
  const priceId = getPriceIdForPlan(plan.key);
  if (!priceId) {
    throw new Error("Plan price is not configured. Contact support.");
  }
  const normalizedDisksize = String(plan.pdsDiskSizeGb);
  const pdsHostnameBase = pdsHostnameForSlug(pdsUsername);

  // Get or create Stripe customer
  let customerId = await getStripeCustomerId();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!existingSub) {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        stripe_customer_id: customerId,
      });
      if (error) throw error;
    }
  }

  const headersList = await headers();
  const originHeader = headersList.get("origin");
  const hostHeader = headersList.get("host");
  const origin =
    originHeader ||
    `https://${hostHeader}` ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    metadata: {
      user_id: user.id,
      user_email: user.email!,
      pds_username: pdsUsername,
      pds_plan: plan.key,
      pds_disksize_gb: normalizedDisksize,
      pds_hostname_base: pdsHostnameBase,
    },
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${welcomeNamePath({ pds_plan: plan.key })}`,
  });

  return { url: checkoutSession.url };
}

/**
 * Cancel subscription (sets cancel_at_period_end)
 */
export async function cancelSubscription() {
  const subscription = await getActiveSubscription();

  if (!subscription) {
    return { success: false, error: "No active subscription found" };
  }

  try {
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    return { success: true };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription",
    };
  }
}

/**
 * Resume subscription (removes cancel_at_period_end)
 */
export async function resumeSubscription() {
  const customerId = await getStripeCustomerId();
  if (!customerId) {
    return { success: false, error: "No subscription found" };
  }

  try {
    // Find subscription that's scheduled for cancellation
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    const cancelingSubscription = subscriptions.data.find(
      (sub) =>
        sub.cancel_at_period_end === true &&
        (sub.status === "active" || sub.status === "trialing")
    );

    if (!cancelingSubscription) {
      return {
        success: false,
        error: "No subscription scheduled for cancellation found",
      };
    }

    await stripe.subscriptions.update(cancelingSubscription.id, {
      cancel_at_period_end: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error resuming subscription:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to resume subscription",
    };
  }
}

/**
 * Create billing portal session
 */
export async function createBillingPortalSession() {
  const customerId = await getStripeCustomerId();

  if (!customerId) {
    return { success: false, error: "No subscription found" };
  }

  const headersList = await headers();
  const originHeader = headersList.get("origin");
  const hostHeader = headersList.get("host");
  const origin =
    originHeader ||
    `https://${hostHeader}` ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create billing portal session",
    };
  }
}
