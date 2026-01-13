"use client";

import { useState } from "react";
import { createSubscriptionCheckout } from "@/actions/subscription";

interface DashboardClientProps {
  subscribed: boolean;
  subscription: any;
  priceId: string;
}

export default function DashboardClient({ subscribed, subscription, priceId }: DashboardClientProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!priceId) {
      alert("Stripe price ID not configured. Please set NEXT_PUBLIC_STRIPE_PRICE_ID in your environment variables.");
      return;
    }

    setLoading(true);
    try {
      const { url } = await createSubscriptionCheckout(priceId);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to create checkout session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleServerCall = async (endpoint: string) => {
    try {
      const response = await fetch(`/api/server/${endpoint}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to make server call");
      }

      const data = await response.json();
      alert(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error("Error making server call:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (!subscribed) {
    return (
      <div style={{ marginTop: "32px", padding: "24px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h2>Subscribe to Access</h2>
        <p>You need an active subscription to access the server features.</p>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            marginTop: "16px",
            padding: "12px 24px",
            borderRadius: "6px",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "1px solid #ffffff",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Loading..." : "Subscribe Now"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "32px" }}>
      <div style={{ padding: "24px", border: "1px solid #4caf50", borderRadius: "8px", backgroundColor: "#f0f9f0", marginBottom: "24px" }}>
        <h2 style={{ color: "#4caf50", marginTop: 0 }}>✓ Active Subscription</h2>
        {subscription && (
          <div>
            <p>
              <strong>Status:</strong> {subscription.status}
            </p>
            {subscription.current_period_end && (
              <p>
                <strong>Renews:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "24px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h2>Server Actions</h2>
        <p>You have access to the following server endpoints:</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          <button
            onClick={() => handleServerCall("action1")}
            style={{
              padding: "12px 24px",
              borderRadius: "6px",
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "1px solid #ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Call Server Action 1
          </button>
          
          <button
            onClick={() => handleServerCall("action2")}
            style={{
              padding: "12px 24px",
              borderRadius: "6px",
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "1px solid #ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Call Server Action 2
          </button>
        </div>
      </div>
    </div>
  );
}
