import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { formatPdsStorageLabel, type PlanCatalogEntry } from "@/lib/plan-catalog";

type PlanSummaryCardProps = {
  plan: PlanCatalogEntry;
  displayPrice: string | null;
  compact?: boolean;
};

export function PlanSummaryCard({
  plan,
  displayPrice,
  compact = false,
}: PlanSummaryCardProps) {
  return (
    <div
      className={[
        "rounded-lg border px-4 py-3",
        plan.highlight
          ? "border-fuchsia-400/40 bg-fuchsia-500/10"
          : "border-white/10 bg-white/5",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <Heading as="h3" className="text-sm font-semibold text-white">
          {plan.name} plan
        </Heading>
        {plan.badge ? (
          <span className="shrink-0 rounded-full bg-neutral-900/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-fuchsia-300">
            {plan.badge}
          </span>
        ) : null}
      </div>

      {displayPrice ? (
        <Paragraph className="mt-2 text-lg font-semibold text-white">
          {displayPrice}
          <span className="ml-1 text-sm font-normal text-white/70">
            per month
          </span>
        </Paragraph>
      ) : null}

      <Paragraph className="mt-2 text-sm text-white/70">{plan.description}</Paragraph>

      <Paragraph className="mt-2 text-xs text-white/60">
        {formatPdsStorageLabel(plan)} · Next, choose a name, then complete payment
        to start provisioning.
      </Paragraph>

      {!compact && (
        <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm text-white/75"
            >
              <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-fuchsia-400" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
