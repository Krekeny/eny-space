import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/actions/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  highlight?: boolean;
  features: string[];
};

const PLANS: PricingPlan[] = [
  {
    name: "Starter plan",
    price: "$19",
    period: "per month",
    description: "Perfect for small projects.",
    features: [
      "1 GB storage",
      "5 app deployments",
      "Basic security protocols",
      "24/7 support access",
    ],
  },
  {
    name: "Growth plan",
    price: "$49",
    period: "per month",
    badge: "Popular",
    description: "Scale without limits.",
    highlight: true,
    features: [
      "10 GB storage",
      "Unlimited app deployments",
      "Advanced security and encryption",
      "Priority support with dedicated manager",
    ],
  },
  {
    name: "Pro plan",
    price: "$99",
    period: "per month",
    description: "Enterprise‑level performance.",
    features: [
      "Unlimited storage",
      "Custom domain support",
      "Dedicated node hosting",
      "Real‑time monitoring and analytics",
      "Premium 24/7 support with SLA",
    ],
  },
];

export function PricingSection() {
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
          Flexible Pricing for Every Stage of Growth.
        </Heading>
        <Paragraph className="mt-4 text-sm text-white/70 sm:text-base">
          From startups to enterprises, choose a plan that fits your needs. Pay
          only for what you use and scale effortlessly.
        </Paragraph>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={[
              "flex h-full flex-col justify-between rounded-3xl border-none bg-gradient-to-b from-neutral-800/90 to-neutral-900/90 p-6 text-white shadow-xl/30",
              plan.highlight
                ? "relative bg-gradient-to-b from-amber-400/90 via-amber-400/80 to-amber-500/90 text-neutral-950 shadow-[0_0_40px_rgba(190,242,100,0.4)]"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <CardHeader className="flex flex-col gap-2 px-0">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">
                  {plan.name}
                </CardTitle>
                {plan.badge ? (
                  <span className="rounded-full bg-neutral-900/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-300 md:text-[11px]">
                    {plan.badge}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold sm:text-5xl">
                  {plan.price}
                </span>
                <span className="text-sm font-medium opacity-80">
                  {plan.period}
                </span>
              </div>
              <Paragraph
                className={[
                  "mt-3 text-sm",
                  plan.highlight ? "text-neutral-900/80" : "text-white/70",
                ].join(" ")}
              >
                {plan.description}
              </Paragraph>
            </CardHeader>

            <CardContent className="mt-6 flex flex-1 flex-col gap-6 px-0">
              <ButtonLink
                href="/signup"
                className={[
                  "w-full rounded-full px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition",
                  plan.highlight
                    ? "bg-neutral-950 text-amber-300 hover:bg-neutral-900"
                    : "bg-white text-neutral-950 hover:bg-neutral-200",
                ].join(" ")}
              >
                Get started
              </ButtonLink>

              <div className="pt-2 text-left">
                <Paragraph
                  className={[
                    "text-xs font-semibold uppercase tracking-[0.18em]",
                    plan.highlight ? "text-neutral-900/70" : "text-white/60",
                  ].join(" ")}
                >
                  Key features on {plan.name.split(" ")[0]}
                </Paragraph>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={[
                        "flex items-start gap-2",
                        plan.highlight
                          ? "text-neutral-900/80"
                          : "text-white/75",
                      ].join(" ")}
                    >
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-block size-1.5 rounded-full bg-amber-400" />
                        <span>{feature}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
