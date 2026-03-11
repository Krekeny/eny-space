"use client";

import { useState } from "react";
import {
  createSubscriptionCheckout,
  cancelSubscription,
  resumeSubscription,
  createBillingPortalSession,
} from "@/actions/subscription";

interface DashboardClientProps {
  subscribed: boolean;
  subscription: any;
  priceId: string;
}

export default function DashboardClient({
  subscribed,
  subscription,
  priceId,
}: DashboardClientProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!priceId) {
      alert(
        "Stripe price ID not configured. Please set NEXT_PUBLIC_STRIPE_PRICE_ID in your environment variables."
      );
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
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const hasSubscription = !!subscription;
  const isCanceled =
    subscription?.status === "canceled" || subscription?.status === "past_due";

  if (!hasSubscription) {
    return (
      <div>
        <h2>Subscribe to Access</h2>
        <p>You need an active subscription to access the server features.</p>
        <button
          className="cursor-pointer"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? "Loading..." : "Subscribe Now"}
        </button>
      </div>
    );
  }

  if (isCanceled) {
    return (
      <div>
        <h2>Subscription Canceled</h2>
        <p>
          Your subscription has been canceled. Subscribe again to regain access.
        </p>
        <button
          className="cursor-pointer"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? "Loading..." : "Subscribe Again"}
        </button>
      </div>
    );
  }

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll have access until the end of your billing period."
      )
    ) {
      return;
    }

    setActionLoading("cancel");
    try {
      const result = await cancelSubscription();
      if (result.success) {
        alert(
          "Subscription canceled. You'll have access until the end of your billing period."
        );
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

  return (
    <div>
      <h2>{isCanceling ? "Subscription Canceling" : "Active Subscription"}</h2>
      {subscription && (
        <div>
          <p>
            <strong>Status:</strong> {subscription.status}
          </p>
          {subscription.current_period_end && (
            <p>
              <strong>{isCanceling ? "Access until:" : "Renews:"}</strong>{" "}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
          {isCanceling && (
            <p>
              Your subscription will cancel at the end of the billing period.
            </p>
          )}
        </div>
      )}

      <p>
        <button
          className="cursor-pointer"
          onClick={handleManageBilling}
          disabled={actionLoading !== null}
        >
          {actionLoading === "billing"
            ? "Loading..."
            : "Manage Payment Method"}
        </button>
      </p>

      <p>
        {isCanceling ? (
          <button
            className="cursor-pointer"
            onClick={handleResume}
            disabled={actionLoading !== null}
          >
            {actionLoading === "resume"
              ? "Loading..."
              : "Resume Subscription"}
          </button>
        ) : (
          <button
            className="cursor-pointer"
            onClick={handleCancel}
            disabled={actionLoading !== null}
          >
            {actionLoading === "cancel"
              ? "Loading..."
              : "Cancel Subscription"}
          </button>
        )}
      </p>

      <hr />
      <h2>Server Actions</h2>
      <p>You have access to the following server endpoints:</p>
      <p>
        <button
          className="cursor-pointer"
          onClick={() => handleServerCall("action1")}
        >
          Call Server Action 1
        </button>
      </p>
      <p>
        <button
          className="cursor-pointer"
          onClick={() => handleServerCall("action2")}
        >
          Call Server Action 2
        </button>
      </p>
    </div>
  );
}
