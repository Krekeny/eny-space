"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createSubscriptionCheckout,
  cancelSubscription,
  resumeSubscription,
  createBillingPortalSession,
} from "@/actions/subscription";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/actions/components/ui/button";

interface DashboardClientProps {
  subscribed: boolean;
  subscription: any;
  priceId: string;
  autoCheckoutFromPlan?: boolean;
  pdsPlan?: string;
  pdsUsername?: string;
  pdsHostname?: string;
  pdsDisksizeGb?: string;
}

export default function DashboardClient({
  subscribed,
  subscription,
  priceId,
  autoCheckoutFromPlan,
  pdsPlan,
  pdsUsername,
  pdsHostname,
  pdsDisksizeGb,
}: DashboardClientProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const hasAutoStartedCheckout = useRef(false);

  const planBasedDisksize = useMemo(() => {
    if (pdsDisksizeGb && Number(pdsDisksizeGb) > 0) {
      return Number(pdsDisksizeGb);
    }

    const p = (pdsPlan || "").toLowerCase();
    if (p === "community" || p === "growth") return 50;
    if (p === "business" || p === "pro") return 200;
    return 10;
  }, [pdsDisksizeGb, pdsPlan]);

  const selectedUsername = pdsUsername || undefined;
  const selectedHostname = pdsHostname || undefined;

  const handleSubscribe = async () => {
    if (!priceId) {
      alert(
        "Stripe price ID not configured. Set NEXT_PUBLIC_STRIPE_PRICE_PERSONAL_ID (and COMMUNITY/BUSINESS) or NEXT_PUBLIC_STRIPE_PRICE_ID as fallback.",
      );
      return;
    }

    setLoading(true);
    try {
      const { url } = await createSubscriptionCheckout(priceId, {
        username: selectedUsername,
        hostname: selectedHostname,
        disksizeGb: planBasedDisksize,
      });
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

  useEffect(() => {
    if (
      autoCheckoutFromPlan &&
      !subscribed &&
      !loading &&
      !hasAutoStartedCheckout.current
    ) {
      hasAutoStartedCheckout.current = true;
      void handleSubscribe();
    }
  }, [autoCheckoutFromPlan, subscribed, loading]);

  const hasSubscription = !!subscription;
  const isCanceled =
    subscription?.status === "canceled" || subscription?.status === "past_due";

  if (!hasSubscription) {
    return (
      <div className="space-y-3 text-white">
        <Heading as="h2" className="text-base font-semibold">
          Subscribe to Access
        </Heading>
        <Paragraph className="text-sm text-white/80">
          You need an active subscription to access the server features.
        </Paragraph>
        {(pdsPlan || selectedHostname || selectedUsername) && (
          <Paragraph className="text-xs text-white/70">
            Selected plan settings: plan={pdsPlan || "personal"}, disksize=
            {planBasedDisksize}GiB
            {selectedHostname ? `, hostname=${selectedHostname}` : ""}
            {selectedUsername ? `, username=${selectedUsername}` : ""}
          </Paragraph>
        )}
        <Button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-1 rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
        >
          {loading ? "Loading..." : "Subscribe Now"}
        </Button>
      </div>
    );
  }

  if (isCanceled) {
    return (
      <div className="space-y-3 text-white">
        <Heading as="h2" className="text-base font-semibold text-rose-300">
          Subscription Canceled
        </Heading>
        <Paragraph className="text-sm text-white/80">
          Your subscription has been canceled. Subscribe again to regain access.
        </Paragraph>
        <Button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-1 rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
        >
          {loading ? "Loading..." : "Subscribe Again"}
        </Button>
      </div>
    );
  }

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll have access until the end of your billing period.",
      )
    ) {
      return;
    }

    setActionLoading("cancel");
    try {
      const result = await cancelSubscription();
      if (result.success) {
        alert(
          "Subscription canceled. You'll have access until the end of your billing period.",
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
    <div className="space-y-4 text-white">
      <Heading
        as="h2"
        className={`text-base font-semibold ${
          isCanceling ? "text-amber-300" : "text-emerald-300"
        }`}
      >
        {isCanceling ? "Cancellation scheduled" : "Active Subscription"}
      </Heading>
      {subscription && (
        <div className="space-y-1 text-sm text-white/80">
          <Paragraph>
            <span className="font-semibold text-white">Status:</span>{" "}
            {subscription.status}
          </Paragraph>
          {subscription.current_period_end && (
            <Paragraph>
              <span className="font-semibold text-white">
                {isCanceling ? "Access until:" : "Renews:"}
              </span>{" "}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </Paragraph>
          )}
          {isCanceling && (
            <Paragraph>
              Your subscription will cancel at the end of the billing period.
            </Paragraph>
          )}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleManageBilling}
            disabled={actionLoading !== null}
            className="rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
          >
            {actionLoading === "billing"
              ? "Loading..."
              : "Manage Payment Method"}
          </Button>

          {isCanceling ? (
            <Button
              onClick={handleResume}
              disabled={actionLoading !== null}
              className="rounded-full border border-white/60 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white hover:bg-white/10"
            >
              {actionLoading === "resume"
                ? "Loading..."
                : "Resume Subscription"}
            </Button>
          ) : (
            <Button
              onClick={handleCancel}
              disabled={actionLoading !== null}
              className="rounded-full border border-white/40 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white hover:bg-white/10"
            >
              {actionLoading === "cancel"
                ? "Loading..."
                : "Cancel Subscription"}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
