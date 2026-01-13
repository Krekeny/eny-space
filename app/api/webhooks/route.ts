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
    // On error, log and return the error message.
    if (!(err instanceof Error)) console.log(err);
    console.log(`❌ Error message: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 },
    );
  }

  // Successfully constructed event.
  console.log("✅ Success:", event.id);

  const supabase = createAdminClient();

  const permittedEvents: string[] = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
  ];

  if (permittedEvents.includes(event.type)) {
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`💰 CheckoutSession completed: ${session.id}`);

          if (session.mode === "subscription" && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string,
              { expand: ["items.data.price.product"] }
            );

            const userId = session.metadata?.user_id;
            if (userId) {
              const { error } = await supabase.from("subscriptions").upsert({
                user_id: userId,
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0]?.price.id,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              });
              
              if (error) {
                console.error("Error upserting subscription:", error);
              } else {
                console.log(`✅ Subscription synced for user ${userId}`);
              }
            } else {
              console.warn("No user_id in checkout session metadata");
            }
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`📦 Subscription ${event.type}: ${subscription.id}`);

          // Find user by customer ID
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", subscription.customer as string)
            .single();

          if (existing?.user_id) {
            const { error } = await supabase.from("subscriptions").upsert({
              user_id: existing.user_id,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price.id,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            });
            
            if (error) {
              console.error("Error upserting subscription:", error);
            }
          } else {
            // Try to find user by customer metadata
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            if (customer && !customer.deleted && customer.metadata?.supabase_user_id) {
              const { error } = await supabase.from("subscriptions").upsert({
                user_id: customer.metadata.supabase_user_id,
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0]?.price.id,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              });
              
              if (error) {
                console.error("Error upserting subscription:", error);
              }
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`🗑️ Subscription deleted: ${subscription.id}`);

          await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("stripe_subscription_id", subscription.id);
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`💳 Invoice payment succeeded: ${invoice.id}`);

          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              invoice.subscription as string
            );

            const { data: existing } = await supabase
              .from("subscriptions")
              .select("user_id")
              .eq("stripe_subscription_id", subscription.id)
              .single();

            if (existing?.user_id) {
              await supabase.from("subscriptions").upsert({
                user_id: existing.user_id,
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items.data[0]?.price.id,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              });
            }
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`❌ Invoice payment failed: ${invoice.id}`);

          if (invoice.subscription) {
            await supabase
              .from("subscriptions")
              .update({ status: "past_due" })
              .eq("stripe_subscription_id", invoice.subscription as string);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error("Webhook handler error:", error);
      return NextResponse.json(
        { message: "Webhook handler failed" },
        { status: 500 },
      );
    }
  }
  // Return a response to acknowledge receipt of the event.
  return NextResponse.json({ message: "Received" }, { status: 200 });
}
