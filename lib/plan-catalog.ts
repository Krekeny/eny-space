import { normalizePlanKey, type PlanKey } from "@/lib/plan-keys";

export type PlanCatalogEntry = {
  key: PlanKey;
  name: string;
  description: string;
  /** PDS disk size (GB) for marketing UI and provisioning. */
  pdsDiskSizeGb: number;
  badge?: string;
  highlight?: boolean;
  features: string[];
};

export const PLAN_CATALOG: Record<PlanKey, PlanCatalogEntry> = {
  personal: {
    key: "personal",
    name: "Personal",
    description: "Perfect for small projects.",
    pdsDiskSizeGb: 1,
    features: [
      "1 GB storage",
      "5 app deployments",
      "Basic security protocols",
      "24/7 support access",
    ],
  },
  community: {
    key: "community",
    name: "Community",
    description: "Scale without limits.",
    pdsDiskSizeGb: 10,
    badge: "Popular",
    highlight: true,
    features: [
      "10 GB storage",
      "Unlimited app deployments",
      "Advanced security and encryption",
      "Priority support with dedicated manager",
    ],
  },
  business: {
    key: "business",
    name: "Business",
    description: "Enterprise-level performance.",
    pdsDiskSizeGb: 100,
    features: [
      "100 GB storage",
      "Custom domain support",
      "Dedicated node hosting",
      "Real-time monitoring and analytics",
      "Premium 24/7 support with SLA",
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

export function disksizeGbForPlan(
  pdsPlan?: string,
  pdsDisksizeGb?: string,
): number {
  const override = Number(pdsDisksizeGb);
  if (Number.isFinite(override) && override > 0) {
    return Math.floor(override);
  }

  return getPlanCatalogEntry(pdsPlan).pdsDiskSizeGb;
}
