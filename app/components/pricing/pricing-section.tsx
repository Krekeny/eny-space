import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/actions/subscription";
import { PlanCards } from "./plan-cards";

export async function PricingSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Hide the "Get started" CTAs for users who already have an active plan.
  let isSubscribed = false;
  if (user) {
    const { active } = await getSubscriptionStatus();
    isSubscribed = active;
  }

  return (
    <section
      id="pricing"
      className="relative w-full px-4 py-20 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-5xl text-center">
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Simple Pricing for Individuals, Developers and Communities.
        </Heading>
        <Paragraph className="mt-4 text-sm text-white/70 sm:text-base">
          Whether you're an indie developer, a power user, or running a
          community.
          <br />
          Pick a plan that fits and own your data without managing
          infrastructure.
        </Paragraph>
      </div>

      <div className="mx-auto mt-12 max-w-6xl">
        <PlanCards isLoggedIn={!!user} isSubscribed={isSubscribed} />
      </div>
    </section>
  );
}
