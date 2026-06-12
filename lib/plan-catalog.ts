import { normalizePlanKey, type PlanKey } from "@/lib/plan-keys";

export type PlanCatalogEntry = {
  key: PlanKey;
  name: string;
  description: string;
  /** PDS disk size (GB) for marketing UI and provisioning. */
  pdsDiskSizeGb: number;
  badge?: string;
  highlight?: boolean;
  /** When true the plan is shown on the pricing page but cannot be purchased yet. */
  disabled?: boolean;
  features: string[];
};

export const PLAN_CATALOG: Record<PlanKey, PlanCatalogEntry> = {
  personal: {
    key: "personal",
    name: "Personal",
    description: "Your own AT Protocol PDS, ready in seconds.",
    pdsDiskSizeGb: 1,
    features: [
      "1 GB blob & repo storage",
      "Personal AT Protocol PDS",
      "Your handle: yourpds.eny.space",
      "Managed updates & backups",
    ],
  },
  community: {
    key: "community",
    name: "Community",
    description: "Host your own corner of the Atmosphere.",
    pdsDiskSizeGb: 10,
    // badge: "Popular",
    highlight: true,
    features: [
      "10 GB blob & repo storage",
      "Host multiple accounts",
      "Invite codes for your members",
      "Custom domain support (coming soon)",
      "Managed updates & backups",
    ],
  },
  business: {
    key: "business",
    name: "Organization",
    description: "Dedicated infrastructure for teams and companies.",
    pdsDiskSizeGb: 100,
    disabled: true,
    features: [
      "100+ GB blob & repo storage",
      "Unlimited hosted accounts",
      "Dedicated node",
      "Custom domain & SLA",
      "Priority support",
    ],
  },
};

export function formatPdsStorageLabel(plan: PlanCatalogEntry): string {
  return `${plan.pdsDiskSizeGb} GB PDS storage`;
}

export function getPlanCatalogEntry(
  planKey?: string | null,
): PlanCatalogEntry {
  return PLAN_CATALOG[normalizePlanKey(planKey)];
}

