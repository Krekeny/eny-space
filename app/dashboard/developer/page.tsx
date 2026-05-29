import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/actions/subscription";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/actions/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import DashboardClient from "../dashboard-client";
import { ServiceDetailsClient } from "../service-details-client";
import { AtprotoTestClient } from "../atproto-test-client";
import { CollapsibleSection } from "../collapsible-section";
import { getPdsServiceForCurrentUser } from "../../api/pds/atproto/helpers";
import { welcomePath } from "@/lib/onboarding";
import { pdsStateLabel } from "@/lib/pds-state";
import { PdsHealthClient } from "../pds-health-client";

type DashboardPageProps = {
  searchParams?: Promise<{
    pds_plan?: string;
    pds_disksize_gb?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { subscribed, subscription } = await getSubscriptionStatus();

  if (!subscribed) {
    redirect(
      welcomePath({
        pds_plan: params?.pds_plan,
        pds_disksize_gb: params?.pds_disksize_gb,
      }),
    );
  }

  let pdsHostname: string | null = null;
  let pdsStatus = subscribed ? "active" : "provisioning";

  try {
    const { service } = await getPdsServiceForCurrentUser();
    pdsHostname = service?.hostname || service?.encrypted_config?.hostname || null;
    if (service?.state !== undefined && service.state !== null) {
      pdsStatus = pdsStateLabel(service.state);
    }
  } catch {
    // Service not provisioned yet or API unavailable — fall back to subscription-derived status
  }

  const pdsDashboardUrl = pdsHostname ? `https://pdsls.dev/${pdsHostname}` : null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <ButtonLink href="/dashboard" className="text-sm text-white/50 hover:text-white">
          ← Dashboard
        </ButtonLink>
        <Heading as="h1" className="text-lg font-semibold text-white">
          Developer Settings
        </Heading>
      </div>

      {/* Overview — always visible */}
      <Card>
        <CardHeader>
          <Heading as="h1" className="text-xl font-semibold text-white">
            My PDS
          </Heading>
          <Paragraph className="text-sm text-white/80">
            Authenticated as {user.email}.
          </Paragraph>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 text-white">
            <div className="space-y-1">
              <Paragraph className="text-sm font-medium text-white/60">Status</Paragraph>
              <Paragraph className="text-base font-semibold capitalize">{pdsStatus}</Paragraph>
            </div>
            <div className="space-y-1">
              <Paragraph className="text-sm font-medium text-white/60">Hostname</Paragraph>
              {pdsDashboardUrl ? (
                <a
                  href={pdsDashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-semibold text-primary underline underline-offset-2"
                >
                  {pdsHostname}
                </a>
              ) : (
                <Paragraph className="text-base font-semibold text-white/50">Pending</Paragraph>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {pdsDashboardUrl && (
              <ButtonLink
                href={pdsDashboardUrl}
                className="border border-white/80 bg-transparent uppercase tracking-wide text-white hover:bg-white/10 hover:border-white focus-visible:ring-white/50"
              >
                Open dashboard
              </ButtonLink>
            )}
          </div>
          {pdsHostname && (
            <PdsHealthClient pdsHost={`https://${pdsHostname}`} />
          )}
        </CardContent>
      </Card>

      {/* Usage & Stats — hidden when real API returns no stats */}
      <ServiceDetailsClient mode="stats" />

      {/* Service Details */}
      <CollapsibleSection title="Service Details">
        <ServiceDetailsClient mode="details" />
      </CollapsibleSection>

      {/* AT Protocol */}
      <CollapsibleSection title="AT Protocol">
        <AtprotoTestClient />
      </CollapsibleSection>

      {/* Billing & Subscription */}
      <CollapsibleSection title="Billing & Subscription" defaultOpen>
        <DashboardClient
          subscribed={subscribed}
          subscription={subscription}
          priceId=""
          pdsPlan={params?.pds_plan}
          pdsDisksizeGb={params?.pds_disksize_gb}
        />
      </CollapsibleSection>
    </main>
  );
}
