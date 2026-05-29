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
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import DashboardClient from "../dashboard/dashboard-client";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";
import { formatStripePrice } from "@/lib/format-stripe-price";
import { getStripePlanAmounts } from "@/lib/stripe-plans";
import type { OnboardingSearchParams } from "@/lib/onboarding";
import { WelcomeCheckout } from "./welcome-checkout";
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

  const { subscribed, subscription } = await getSubscriptionStatus();

  if (subscribed) {
    redirect("/dashboard");
  }

  const selectedPlan = params?.pds_plan
    ? getPlanCatalogEntry(params.pds_plan)
    : null;
  const stripeAmounts = selectedPlan
    ? await getStripePlanAmounts()
    : null;
  const displayPrice =
    selectedPlan && stripeAmounts
      ? formatStripePrice(
          stripeAmounts[selectedPlan.key].unitAmount,
          stripeAmounts[selectedPlan.key].currency,
        )
      : null;

  if (!selectedPlan) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center space-y-6">
          <OnboardingSteps currentStep={1} />
          <div>
            <Heading as="h1" className="text-2xl font-semibold text-white">
              Choose a plan
            </Heading>
            <Paragraph className="mt-2 text-sm text-white/60">
              Pick a plan to activate your PDS.
            </Paragraph>
          </div>
        </div>
        <PlanCards isLoggedIn />
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl bg-white/5">
        <CardHeader>
          <div className="mb-4">
            <OnboardingSteps currentStep={1} />
          </div>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Confirm your {selectedPlan.name} plan and continue setup.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4 text-white">
            <WelcomeCheckout plan={selectedPlan} displayPrice={displayPrice} />
            {subscription && (
              <DashboardClient
                subscribed={subscribed}
                subscription={subscription}
                pdsPlan={selectedPlan.key}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
