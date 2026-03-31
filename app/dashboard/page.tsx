import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/actions/subscription";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/actions/components/ui/card";
import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import DashboardClient from "./dashboard-client";
import { ServiceDetailsClient } from "./service-details-client";
import { AtprotoTestClient } from "./atproto-test-client";

type DashboardPageProps = {
  searchParams?: {
    auto_checkout?: string;
    pds_plan?: string;
    pds_username?: string;
    pds_hostname?: string;
    pds_disksize_gb?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { subscribed, subscription } = await getSubscriptionStatus();

  // Simple stubbed PDS status derived from subscription state
  const pdsStatus = subscribed ? "active" : "provisioning";
  const pdsHostname =
    user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9-]/g, "-") +
      ".eny.space" || "pending.eny.space";
  const pdsDashboardUrl = `https://${pdsHostname}`;

  return (
    <main className="flex flex-col gap-6 px-4 py-6">
      <Card>
        <CardHeader>
          <Heading as="h1" className="text-xl font-semibold text-white">
            My PDS
          </Heading>
          <Paragraph className="text-sm text-white/80">
            Authenticated as {user.email}. This is your Personal Data Server
            overview.
          </Paragraph>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 text-white">
            <div className="space-y-2">
              <Paragraph className="text-sm font-medium text-white/80">
                Status
              </Paragraph>
              <Paragraph className="text-base font-semibold capitalize">
                {pdsStatus}
              </Paragraph>
            </div>
            <div className="space-y-2">
              <Paragraph className="text-sm font-medium text-white/80">
                URL / Hostname
              </Paragraph>
              <a
                href={pdsDashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="text-base font-semibold text-primary underline underline-offset-2"
              >
                {pdsHostname}
              </a>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-md border border-white/10 bg-white/5 p-4 text-white backdrop-blur-xl">
            <Paragraph className="text-sm font-medium text-white/80">
              Usage summary
            </Paragraph>
            <ServiceDetailsClient mode="stats" />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink
              href="/dashboard/manage"
              className="border border-white/80 bg-transparent uppercase tracking-wide text-white hover:bg-white/10 hover:border-white focus-visible:ring-white/50"
            >
              Manage
            </ButtonLink>
            <ButtonLink
              href={pdsDashboardUrl}
              className="border border-white/80 bg-transparent uppercase tracking-wide text-white hover:bg-white/10 hover:border-white focus-visible:ring-white/50"
            >
              Open dashboard
            </ButtonLink>
          </div>

          <hr className="my-6" />

          <ServiceDetailsClient mode="details" />

          <AtprotoTestClient />

          <section className="space-y-2 text-white">
            <Heading
              as="h2"
              className="text-sm font-semibold uppercase tracking-wide text-white/80"
            >
              Billing & Subscription
            </Heading>
            <DashboardClient
              subscribed={subscribed}
              subscription={subscription}
              priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || ""}
              autoCheckoutFromPlan={searchParams?.auto_checkout === "1"}
              pdsPlan={searchParams?.pds_plan}
              pdsUsername={searchParams?.pds_username}
              pdsHostname={searchParams?.pds_hostname}
              pdsDisksizeGb={searchParams?.pds_disksize_gb}
            />
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
