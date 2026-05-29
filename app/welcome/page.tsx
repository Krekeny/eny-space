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
import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import DashboardClient from "../dashboard/dashboard-client";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";
import { formatStripePrice } from "@/lib/format-stripe-price";
import { getStripePlanAmounts } from "@/lib/stripe-plans";
import type { OnboardingSearchParams } from "@/lib/onboarding";
import { WelcomeCheckout } from "./welcome-checkout";

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

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl bg-white/5">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            {selectedPlan
              ? `Confirm your ${selectedPlan.name} plan and continue setup.`
              : "Almost there — pick a plan to activate your access."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4 text-white">
            <Heading as="h2" className="text-base font-semibold">
              Subscribe to Access
            </Heading>
            {selectedPlan ? (
              <WelcomeCheckout plan={selectedPlan} displayPrice={displayPrice} />
            ) : (
              <div className="space-y-3">
                <Paragraph className="text-sm text-white/80">
                  Choose a plan on our pricing page, then return here to finish
                  setup.
                </Paragraph>
                <ButtonLink
                  href="/#pricing"
                  className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
                >
                  View pricing
                </ButtonLink>
              </div>
            )}
            {subscription && selectedPlan && (
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
