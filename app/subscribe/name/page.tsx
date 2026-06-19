import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/actions/subscription";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/actions/components/ui/card";
import { PlanSummaryCard } from "@/components/plan/plan-summary-card";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";
import { formatStripePrice } from "@/lib/format-stripe-price";
import { getStripePlanAmounts } from "@/lib/stripe-plans";
import type { OnboardingSearchParams } from "@/lib/onboarding";
import { PdsNameForm } from "../pds-name-form";
import { OnboardingSteps } from "../onboarding-steps";

type WelcomeNamePageProps = {
  searchParams?: Promise<OnboardingSearchParams>;
};

export default async function WelcomeNamePage({
  searchParams,
}: WelcomeNamePageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { active } = await getSubscriptionStatus();
  if (active) {
    redirect("/dashboard");
  }

  if (!params?.pds_plan) {
    redirect("/subscribe");
  }

  // If the user already has a PDS, this is a resubscribe — lock to their
  // existing name. The webhook reactivates it on checkout (no new provisioning).
  const { data: pdsRow } = await supabase
    .from("pds_services")
    .select("hostname")
    .eq("user_id", user.id)
    .maybeSingle();
  const suffix = process.env.NEXT_PUBLIC_PDS_HOSTNAME_SUFFIX ?? ".eny.space";
  const existingHost = pdsRow?.hostname
    ?.replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
  const existingName =
    existingHost && existingHost.endsWith(suffix)
      ? existingHost.slice(0, -suffix.length)
      : existingHost || null;

  const plan = getPlanCatalogEntry(params.pds_plan);
  const stripeAmounts = await getStripePlanAmounts();
  const displayPrice = formatStripePrice(
    stripeAmounts[plan.key].unitAmount,
    stripeAmounts[plan.key].currency,
  );

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg bg-white/5">
        <CardHeader>
          <div className="mb-4">
            <OnboardingSteps currentStep={2} />
          </div>
          <CardTitle>
            {existingName ? "Welcome back" : "Choose your PDS name"}
          </CardTitle>
          <CardDescription>
            {existingName
              ? `Resubscribe to bring your PDS back online on the ${plan.name} plan.`
              : `Pick a unique name for your ${plan.name} PDS before we provision it.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-white">
          <PlanSummaryCard plan={plan} displayPrice={displayPrice} compact />

          <PdsNameForm pdsPlan={plan.key} lockedName={existingName ?? undefined} />
        </CardContent>
      </Card>
    </main>
  );
}
