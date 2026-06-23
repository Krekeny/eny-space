import { redirect } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getSubscriptionStatus,
  getPreviousPlanKey,
} from "@/actions/subscription";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";
import type { OnboardingSearchParams } from "@/lib/onboarding";
import { subscribeNamePath } from "@/lib/onboarding";
import {
  effectiveLifecycle,
  type PdsLifecycleStatus,
} from "@/lib/pds-lifecycle";
import { PlanCards } from "@/components/pricing/plan-cards";
import { OnboardingSteps } from "./onboarding-steps";

type WelcomePageProps = {
  searchParams?: Promise<OnboardingSearchParams>;
};

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { active, subscription } = await getSubscriptionStatus();

  // Still have access (incl. cancel-at-period-end) → dashboard, not onboarding.
  if (active) {
    redirect("/dashboard");
  }

  // Resolve the user's PDS lifecycle once.
  const { data: row } = await supabase
    .from("pds_services")
    .select("pds_service_id, lifecycle_status, grace_until, delete_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const lifecycle = row
    ? effectiveLifecycle({
        status: (row.lifecycle_status ?? "active") as PdsLifecycleStatus,
        graceUntil: row.grace_until ? new Date(row.grace_until) : null,
        deleteAt: row.delete_at ? new Date(row.delete_at) : null,
      })
    : "active";

  // Recoverable PDS (grace/suspended): lock resubscribe to that exact plan and skip plan selection
  const recoverable =
    !!row?.pds_service_id &&
    (lifecycle === "grace" || lifecycle === "suspended");
  if (recoverable) {
    const previousPlan = await getPreviousPlanKey();
    if (previousPlan) {
      redirect(subscribeNamePath({ pds_plan: previousPlan }));
    }
  }

  // New user who already picked a plan (post-signup / plan card) → name step.
  if (params?.pds_plan) {
    const plan = getPlanCatalogEntry(params.pds_plan);
    redirect(subscribeNamePath({ pds_plan: plan.key }));
  }

  // A non-null subscription with no active access = a lapsed plan; tell the user
  // why they're here.
  const subscriptionLapsed = subscription !== null;
  const graceDate =
    lifecycle === "grace" && row?.grace_until
      ? new Date(row.grace_until).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center space-y-6">
        <OnboardingSteps currentStep={1} />

        {subscriptionLapsed && (
          <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-left text-sm text-amber-200">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {graceDate
                ? `Your subscription has ended, but your PDS is still online during the grace period — it will be shut down on ${graceDate}. Resubscribe to keep it running, no data lost.`
                : "Your subscription has ended, so your PDS is currently inactive. Choose a plan below to resubscribe and bring it back online."}
            </span>
          </div>
        )}

        <div>
          <Heading as="h1" className="text-2xl font-semibold text-white">
            {subscriptionLapsed ? "Welcome back" : "Choose a plan"}
          </Heading>
          <Paragraph className="mt-2 text-sm text-white/60">
            {subscriptionLapsed
              ? "Pick a plan to reactivate your PDS."
              : "Pick a plan to activate your PDS."}
          </Paragraph>
        </div>
      </div>
      <PlanCards isLoggedIn />
    </main>
  );
}
