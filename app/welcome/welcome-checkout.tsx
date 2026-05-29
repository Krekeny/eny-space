import { ButtonLink } from "@/components/button-link";
import { PlanSummaryCard } from "@/components/plan/plan-summary-card";
import type { PlanCatalogEntry } from "@/lib/plan-catalog";
import { welcomeNamePath } from "@/lib/onboarding";

type WelcomeCheckoutProps = {
  plan: PlanCatalogEntry;
  displayPrice: string | null;
};

export function WelcomeCheckout({ plan, displayPrice }: WelcomeCheckoutProps) {
  return (
    <div className="space-y-4">
      <PlanSummaryCard plan={plan} displayPrice={displayPrice} />

      <ButtonLink
        href={welcomeNamePath({
          pds_plan: plan.key,
          pds_disksize_gb: String(plan.pdsDiskSizeGb),
        })}
        className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
      >
        Choose PDS name
      </ButtonLink>
    </div>
  );
}
