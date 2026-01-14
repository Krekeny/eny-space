"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type { Stripe } from "stripe";

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

    // Find active or trialing subscription
    const activeSubscription = subscriptions.data.find(
      (sub) =>
        (sub.status === "active" || sub.status === "trialing") &&
        !sub.cancel_at_period_end
    );

    return activeSubscription || null;
  } catch (error) {
    console.error("Error fetching subscription from Stripe:", error);
    return null;
  }
}

/**
 * Get subscription status for UI (always from Stripe)
 */
export async function getSubscriptionStatus() {
  const subscription = await getActiveSubscription();

  return {
    subscribed: !!subscription,
    subscription: subscription
      ? {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
        }
      : null,
  };
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
export async function createSubscriptionCheckout(priceId: string) {
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
    metadata: {
      user_id: user.id,
    },
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
