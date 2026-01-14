"use client";

import { useState } from "react";
import { createSubscriptionCheckout, cancelSubscription, resumeSubscription, createBillingPortalSession } from "@/actions/subscription";

interface DashboardClientProps {
  subscribed: boolean;
  subscription: any;
  priceId: string;
}

export default function DashboardClient({ subscribed, subscription, priceId }: DashboardClientProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Show subscription management
  const hasSubscription = !!subscription;
  const isCanceled = subscription?.status === "canceled" || subscription?.status === "past_due";

  if (!hasSubscription) {
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

  if (isCanceled) {
    return (
      <div style={{ marginTop: "32px", padding: "24px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f5f5f5" }}>
        <h2 style={{ color: "#666", marginTop: 0 }}>Subscription Canceled</h2>
        <p>Your subscription has been canceled. Subscribe again to regain access.</p>
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
          {loading ? "Loading..." : "Subscribe Again"}
        </button>
      </div>
    );
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll have access until the end of your billing period.")) {
      return;
    }

    setActionLoading("cancel");
    try {
      const result = await cancelSubscription();
      if (result.success) {
        alert("Subscription canceled. You'll have access until the end of your billing period.");
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    setActionLoading("resume");
    try {
      const result = await resumeSubscription();
      if (result.success) {
        alert("Subscription resumed successfully!");
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error resuming subscription:", error);
      alert("Failed to resume subscription. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading("billing");
    try {
      const result = await createBillingPortalSession();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        alert(`Error: ${result.error || "Failed to open billing portal"}`);
        setActionLoading(null);
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("Failed to open billing portal. Please try again.");
      setActionLoading(null);
    }
  };

  const isCanceling = subscription?.cancel_at_period_end === true;
  const statusColor = isCanceling ? "#ff9800" : "#4caf50";
  const statusBg = isCanceling ? "#fff3e0" : "#f0f9f0";

  return (
    <div style={{ marginTop: "32px" }}>
      <div style={{ padding: "24px", border: `1px solid ${statusColor}`, borderRadius: "8px", backgroundColor: statusBg, marginBottom: "24px" }}>
        <h2 style={{ color: statusColor, marginTop: 0 }}>
          {isCanceling ? "⚠️ Subscription Canceling" : "✓ Active Subscription"}
        </h2>
        {subscription && (
          <div style={{ marginBottom: "16px" }}>
            <p>
              <strong>Status:</strong> {subscription.status}
            </p>
            {subscription.current_period_end && (
              <p>
                <strong>
                  {isCanceling ? "Access until:" : "Renews:"}
                </strong> {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
            {isCanceling && (
              <p style={{ color: "#ff9800", fontWeight: 600 }}>
                Your subscription will cancel at the end of the billing period.
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          <button
            onClick={handleManageBilling}
            disabled={actionLoading !== null}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "1px solid #ffffff",
              cursor: actionLoading !== null ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: actionLoading !== null ? 0.6 : 1,
            }}
          >
            {actionLoading === "billing" ? "Loading..." : "Manage Payment Method"}
          </button>

          {isCanceling ? (
            <button
              onClick={handleResume}
              disabled={actionLoading !== null}
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                backgroundColor: "#4caf50",
                color: "#ffffff",
                border: "1px solid #4caf50",
                cursor: actionLoading !== null ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading !== null ? 0.6 : 1,
              }}
            >
              {actionLoading === "resume" ? "Loading..." : "Resume Subscription"}
            </button>
          ) : (
            <button
              onClick={handleCancel}
              disabled={actionLoading !== null}
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "#ff5722",
                border: "1px solid #ff5722",
                cursor: actionLoading !== null ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: actionLoading !== null ? 0.6 : 1,
              }}
            >
              {actionLoading === "cancel" ? "Loading..." : "Cancel Subscription"}
            </button>
          )}
        </div>
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
