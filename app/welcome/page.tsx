import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/actions/subscription";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";
import type { OnboardingSearchParams } from "@/lib/onboarding";
import { welcomeNamePath } from "@/lib/onboarding";
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

  const { active } = await getSubscriptionStatus();

  // Bounce users who still have access (incl. cancel-at-period-end) to the
  // dashboard rather than back into onboarding.
  if (active) {
    redirect("/dashboard");
  }

  if (params?.pds_plan) {
    const plan = getPlanCatalogEntry(params.pds_plan);
    redirect(welcomeNamePath({ pds_plan: plan.key }));
  }

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
