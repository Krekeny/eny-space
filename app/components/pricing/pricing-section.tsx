import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/actions/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { createClient } from "@/lib/supabase/server";
import { prelaunch } from "@/lib/prelaunch";
import { formatStripePrice } from "@/lib/format-stripe-price";
import { welcomePath } from "@/lib/onboarding";
import { PLAN_CATALOG } from "@/lib/plan-catalog";
import { getStripePlanAmounts, PLAN_KEYS } from "@/lib/stripe-plans";

export async function PricingSection() {
  // Hide the pricing block entirely during prelaunch mode.
  // This keeps the "prelaunch vs launch" behavior controlled by one global flag.
  if (prelaunch) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stripeAmounts = await getStripePlanAmounts();

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

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
        {PLAN_KEYS.map((planKey) => {
          const plan = PLAN_CATALOG[planKey];
          const { unitAmount, currency } = stripeAmounts[planKey];
          const displayPrice = formatStripePrice(unitAmount, currency);

          const onboarding = { pds_plan: plan.key };
          const ctaHref = user
            ? welcomePath(onboarding)
            : `/signup?${new URLSearchParams(onboarding).toString()}`;

          return (
              <Card
                key={plan.name}
                className={[
                  "flex h-full flex-col justify-between rounded-3xl border-none bg-gradient-to-b from-slate-900/65 to-slate-950/75 p-6 text-white shadow-xl/30",
                  plan.highlight
                    ? "relative bg-gradient-to-b from-fuchsia-500/65 via-fuchsia-500/55 to-fuchsia-600/70 text-white shadow-[0_0_36px_rgba(232,121,249,0.3)]"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <CardHeader className="flex flex-col gap-2 px-0">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white">
                      {plan.name}
                    </CardTitle>
                    {plan.badge ? (
                      <span className="absolute right-[7%] rounded-full bg-neutral-900/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-fuchsia-300 md:text-[11px]">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold sm:text-5xl text-white">
                      {displayPrice ?? "—"}
                    </span>
                    <span className="text-sm font-medium opacity-80 text-white">
                      per month
                    </span>
                  </div>
                  <Paragraph
                    className={["mt-3 text-sm text-white/70"].join(" ")}
                  >
                    {plan.description}
                  </Paragraph>
                </CardHeader>

                <CardContent className="mt-6 flex flex-1 flex-col gap-6 px-0">
                  <ButtonLink
                    href={ctaHref}
                    className={[
                      "w-full rounded-full px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition",
                      plan.highlight
                        ? "bg-neutral-950 text-fuchsia-200 hover:bg-neutral-900"
                        : "bg-white text-neutral-950 hover:bg-neutral-200",
                    ].join(" ")}
                  >
                    Get started
                  </ButtonLink>

                  <div className="pt-2 text-left">
                    <Paragraph
                      className={[
                        "text-xs font-semibold uppercase tracking-[0.18em] text-white/60",
                      ].join(" ")}
                    >
                      Key features on {plan.name.split(" ")[0]}
                    </Paragraph>
                    <ul className="mt-4 space-y-2 text-sm">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className={[
                            "flex items-start gap-2 text-white/75",
                          ].join(" ")}
                        >
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-block size-1.5 rounded-full bg-fuchsia-400" />
                            <span>{feature}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
          );
        })}
      </div>
    </section>
  );
}
