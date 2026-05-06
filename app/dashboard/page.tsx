import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/actions/subscription";
import { Card, CardContent, CardHeader } from "@/actions/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { prelaunch } from "@/lib/prelaunch";
import { getPdsServiceForCurrentUser } from "../api/pds/atproto/helpers";
import { isPdsReady, pdsStateLabel } from "@/lib/pds-state";
import { PdsHealthClient } from "./pds-health-client";
import { UserDashboardClient } from "./user-dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { subscribed } = await getSubscriptionStatus();

  if (prelaunch && !subscribed) {
    redirect("/welcome");
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
  const statusLabel = pdsState !== null ? pdsStateLabel(pdsState) : subscribed ? "Provisioning" : "No subscription";

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

      {/* Status card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                ready ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
            <Heading as="h2" className="text-base font-semibold text-white">
              {statusLabel}
            </Heading>
          </div>
          {pdsHostname && (
            <Paragraph className="text-sm text-white/60 font-mono">{pdsHostname}</Paragraph>
          )}
        </CardHeader>
        {pdsHostname && (
          <CardContent>
            <PdsHealthClient pdsHost={`https://${pdsHostname}`} />
          </CardContent>
        )}
      </Card>

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
              The PDS is not ready yet. Forms will appear once it is running.
            </Paragraph>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
