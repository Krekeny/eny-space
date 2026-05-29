"use client";

import { useState } from "react";
import {
  cancelSubscription,
  resumeSubscription,
  createBillingPortalSession,
} from "@/actions/subscription";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { Button } from "@/actions/components/ui/button";
import { ButtonLink } from "@/components/button-link";
import { welcomeNamePath } from "@/lib/onboarding";

interface DashboardClientProps {
  subscribed: boolean;
  subscription: any;
  pdsPlan?: string;
}

export default function DashboardClient({
  subscribed,
  subscription,
  pdsPlan,
}: DashboardClientProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const hasSubscription = !!subscription;
  const isCanceled =
    subscription?.status === "canceled" || subscription?.status === "past_due";

  if (!hasSubscription) {
    return null;
  }

  if (isCanceled) {
    return (
      <div className="space-y-3 text-white">
        <Heading as="h2" className="text-base font-semibold text-rose-300">
          Subscription Canceled
        </Heading>
        <Paragraph className="text-sm text-white/80">
          Your subscription has been canceled. Choose a PDS name and subscribe
          again to regain access.
        </Paragraph>
        <ButtonLink
          href={welcomeNamePath({ pds_plan: pdsPlan })}
          className="mt-1 inline-flex rounded-full bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
        >
          Subscribe again
        </ButtonLink>
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
