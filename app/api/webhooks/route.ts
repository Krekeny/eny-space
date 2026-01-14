import type { Stripe } from "stripe";

import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await (await req.blob()).text(),
      req.headers.get("stripe-signature") as string,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.log(`❌ Webhook Error: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  console.log("✅ Webhook received:", event.type);

  const supabase = createAdminClient();

  // Only handle checkout completion to store customer_id
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription" && session.customer) {
      const userId = session.metadata?.user_id;
      const customerId = typeof session.customer === "string" 
        ? session.customer 
        : session.customer.id;

      if (userId && customerId) {
        // Only store user_id -> stripe_customer_id mapping (minimal)
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
        });

        if (error) {
          console.error("Error storing customer ID:", error);
        } else {
          console.log(`✅ Customer ID stored for user ${userId}`);
        }
      }
    }
  }

  // All other subscription events are handled by querying Stripe directly
  // No need to sync subscription details to database

  return NextResponse.json({ message: "Received" }, { status: 200 });
}
