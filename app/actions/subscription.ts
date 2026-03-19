"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type { Stripe } from "stripe";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 63);
}

type PdsCheckoutOptions = {
  username?: string;
  hostname?: string;
  disksizeGb?: number;
};

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
        subscription: null,
      };
    }

    const isCurrentlySubscribed =
      (latest.status === "active" || latest.status === "trialing") &&
      latest.cancel_at_period_end === false;

    return {
      subscribed: isCurrentlySubscribed,
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
 * Create checkout session for new subscription
 */
export async function createSubscriptionCheckout(
  priceId: string,
  options?: PdsCheckoutOptions,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated");
  }

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

    // Store only customer ID in database (minimal)
    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
    });
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
    // Used later in the Stripe webhook to provision the user's PDS
    // with user-selected settings.
    metadata: (() => {
      const fallbackUsername = normalizeSlug(user.email!.split("@")[0] || "pds");
      const pdsUsername = normalizeSlug(options?.username || fallbackUsername);
      const pdsDisksizeGb = Number(options?.disksizeGb);
      const normalizedDisksize =
        Number.isFinite(pdsDisksizeGb) && pdsDisksizeGb > 0
          ? String(Math.floor(pdsDisksizeGb))
          : "10";

      const requestedHostname = (options?.hostname || "").trim();
      const cleanedHostname = requestedHostname
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, "");
      const pdsHostnameBase = cleanedHostname || `${pdsUsername}.eny.k8s.frx.pub`;

      return {
        user_id: user.id,
        user_email: user.email!,
        pds_username: pdsUsername,
        pds_disksize_gb: normalizedDisksize,
        pds_hostname_base: pdsHostnameBase,
      };
    })(),
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
    cancel_url: `${origin}/dashboard`,
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
