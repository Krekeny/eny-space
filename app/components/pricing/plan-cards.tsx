import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/actions/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { Paragraph } from "@/components/paragraph";
import { formatStripePrice } from "@/lib/format-stripe-price";
import { welcomeNamePath } from "@/lib/onboarding";
import { PLAN_CATALOG } from "@/lib/plan-catalog";
import { getStripePlanAmounts, PLAN_KEYS } from "@/lib/stripe-plans";

type Props = {
  isLoggedIn?: boolean;
};

export async function PlanCards({ isLoggedIn = false }: Props) {
  const stripeAmounts = await getStripePlanAmounts();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLAN_KEYS.map((planKey) => {
        const plan = PLAN_CATALOG[planKey];
        const { unitAmount, currency } = stripeAmounts[planKey];
        const displayPrice = formatStripePrice(unitAmount, currency);

        const onboarding = { pds_plan: plan.key };
        const ctaHref = isLoggedIn
          ? welcomeNamePath(onboarding)
          : `/signup?${new URLSearchParams(onboarding).toString()}`;

        return (
          <Card
            key={plan.name}
            className={[
              "flex h-full flex-col justify-between rounded-3xl border-none bg-gradient-to-b from-slate-900/65 to-slate-950/75 p-6 text-white shadow-xl/30",
              plan.highlight
                ? "relative bg-gradient-to-b from-fuchsia-500/65 via-fuchsia-500/55 to-fuchsia-600/70 text-white shadow-[0_0_36px_rgba(232,121,249,0.3)]"
                : "",
              plan.disabled ? "opacity-70" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <CardHeader className="flex flex-col gap-2 px-0">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white">
                  {plan.name}
                </CardTitle>
                {plan.badge && (
                  <span className="absolute right-[7%] rounded-full bg-neutral-900/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-fuchsia-300 md:text-[11px]">
                    {plan.badge}
                  </span>
                )}
                {plan.disabled && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/50">
                    Coming soon
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                {plan.disabled ? (
                  <span className="text-2xl font-semibold text-white/40">
                    Contact us
                  </span>
                ) : (
                  <>
                    <span className="text-4xl font-semibold sm:text-5xl text-white">
                      {displayPrice ?? "—"}
                    </span>
                    <span className="text-sm font-medium opacity-80 text-white">
                      per month
                    </span>
                  </>
                )}
              </div>
              <Paragraph className="mt-3 text-sm text-white/70">
                {plan.description}
              </Paragraph>
            </CardHeader>

            <CardContent className="mt-6 flex flex-1 flex-col gap-6 px-0">
              {plan.disabled ? (
                <ButtonLink
                  href="mailto:hello+eny-space@krekeny.com"
                  className="w-full rounded-full px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition border border-white/20 bg-transparent text-white/60 hover:border-white/40 hover:text-white/80"
                >
                  Contact us
                </ButtonLink>
              ) : (
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
              )}

              <div className="pt-2 text-left">
                <Paragraph className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Key features on {plan.name.split(" ")[0]}
                </Paragraph>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-white/75">
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
  );
}
