import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/actions/subscription";
import { Card, CardContent } from "@/actions/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { getPdsServiceForCurrentUser } from "../api/pds/atproto/helpers";
import { welcomePath, type OnboardingSearchParams } from "@/lib/onboarding";
import { isPdsReady } from "@/lib/pds-state";
import { PdsStatusCard } from "./pds-status-card";
import { UserDashboardClient } from "./user-dashboard-client";
import DashboardClient from "./dashboard-client";
import { CollapsibleSection } from "./collapsible-section";

type DashboardPageProps = {
  searchParams?: Promise<OnboardingSearchParams>;
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
    redirect(welcomePath({ pds_plan: params?.pds_plan }));
  }

  let pdsHostname: string | null = null;
  let pdsState: number | string | null = null;

  try {
    const { service } = await getPdsServiceForCurrentUser();
    pdsHostname = service?.hostname || service?.encrypted_config?.hostname || null;
    pdsState = service?.state ?? null;
  } catch {
    // Not provisioned yet or API unavailable
  }

  const ready = isPdsReady(pdsState);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" className="text-xl font-semibold text-white">
          My PDS
        </Heading>
        <ButtonLink
          href="/dashboard/developer"
          className="text-sm text-white/40 hover:text-white/80"
        >
          Developer Settings →
        </ButtonLink>
      </div>

      <PdsStatusCard initialState={pdsState} initialHostname={pdsHostname} />

      {/* Forms — only shown when PDS is reachable */}
      {ready ? (
        <Card>
          <CardContent className="pt-6">
            <UserDashboardClient />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Paragraph className="text-sm text-white/50">
              Your PDS is being set up. Once it's running you'll be able to create accounts, generate invite codes, and manage users.
            </Paragraph>
          </CardContent>
        </Card>
      )}

      {/* Billing & Subscription */}
      <CollapsibleSection title="Billing & Subscription">
        <DashboardClient
          subscribed={subscribed}
          subscription={subscription}
          pdsPlan={params?.pds_plan}
        />
      </CollapsibleSection>
    </main>
  );
}
