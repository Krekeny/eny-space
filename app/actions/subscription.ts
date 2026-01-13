"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type { Stripe } from "stripe";

export async function getSubscriptionStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { subscribed: false, subscription: null };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    subscribed: !!subscription && (subscription.status === "active" || subscription.status === "trialing"),
    subscription,
  };
}

export async function syncSubscriptionFromCheckoutSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // SECURITY: Verify the session belongs to this user
    if (session.metadata?.user_id !== user.id) {
      console.error(`Session ${sessionId} does not belong to user ${user.id}`);
      return { success: false, error: "Session does not belong to this user" };
    }

    // SECURITY: Verify payment was successful
    if (session.payment_status !== "paid") {
      return { success: false, error: "Payment not completed" };
    }

    if (session.mode === "subscription" && session.subscription) {
      const subscription = typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

      // SECURITY: Verify subscription customer matches session customer
      if (subscription.customer !== session.customer) {
        return { success: false, error: "Subscription customer mismatch" };
      }

      // Use admin client to bypass RLS (this is a validated update from Stripe)
      // If admin client not available, we can't update (security: prevents user manipulation)
      let supabaseClient;
      try {
        supabaseClient = createAdminClient();
      } catch (error) {
        console.error("Admin client required for subscription sync:", error);
        return { 
          success: false, 
          error: "Server configuration error. Please contact support." 
        };
      }
      
      const { error: dbError } = await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      });

      if (dbError) {
        console.error("Database error:", dbError);
        return { success: false, error: "Failed to sync subscription" };
      }

      return { success: true };
    }

    return { success: false, error: "Not a subscription session" };
  } catch (error) {
    console.error("Error syncing subscription:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createSubscriptionCheckout(priceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated");
  }

  // Get or create Stripe customer
  let customerId: string;
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingSubscription?.stripe_customer_id) {
    customerId = existingSubscription.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;

    // Store customer ID in database (users can now insert their own records)
    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      status: "incomplete",
    });
  }

  const headersList = await headers();
  const originHeader = headersList.get("origin");
  const hostHeader = headersList.get("host");
  const origin = originHeader || `https://${hostHeader}` || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
