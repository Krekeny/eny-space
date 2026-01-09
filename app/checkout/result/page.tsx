import type { Stripe } from "stripe";

import PrintObject from "@/components/PrintObject";
import { stripe } from "@/lib/stripe";

import Link from "next/link";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;

  if (!sessionId) {
    return (
      <div className="pb-[60px] max-w-[600px]">
        <h2>No session found</h2>
        <p>
          It looks like you didn't complete a checkout session, or the session
          information is missing.
        </p>
        <Link
          href="/checkout"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: "6px",
            marginTop: "16px",
            backgroundColor: "#8f6ed5",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Return to purchase page
        </Link>
      </div>
    );
  }

  try {
    const checkoutSession: Stripe.Checkout.Session =
      await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "payment_intent"],
      });

    const paymentIntent =
      checkoutSession.payment_intent as Stripe.PaymentIntent;

    return (
      <>
        <h2>Status: {paymentIntent.status}</h2>
        <h3>Checkout Session response:</h3>
        <PrintObject content={checkoutSession} />
      </>
    );
  } catch (error) {
    return (
      <div className="pb-[60px] max-w-[600px]">
        <h2>Error retrieving session</h2>
        <p>The checkout session could not be retrieved. Please try again.</p>
        <Link
          href="/checkout"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: "6px",
            marginTop: "16px",
            backgroundColor: "#8f6ed5",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Return to purchase page
        </Link>
      </div>
    );
  }
}
