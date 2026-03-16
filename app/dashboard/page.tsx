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
import { Button } from "@/actions/components/ui/button";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
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
          <CardTitle>My PDS</CardTitle>
          <CardDescription>
            Authenticated as {user.email}. This is your Personal Data Server
            overview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <p className="text-base font-semibold capitalize">{pdsStatus}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                URL / Hostname
              </p>
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

          <div className="mt-4 space-y-2 rounded-md border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Usage summary
            </p>
            <p className="text-sm text-muted-foreground">
              Usage analytics for your PDS (storage, bandwidth, user count, and
              more) will appear here.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href="/dashboard/manage">Manage</a>
            </Button>
            <Button asChild variant="default">
              <a href={pdsDashboardUrl} target="_blank" rel="noreferrer">
                Open dashboard
              </a>
            </Button>
          </div>

          <hr className="my-6" />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Billing & Subscription
            </h2>
            <DashboardClient
              subscribed={subscribed}
              subscription={subscription}
              priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || ""}
            />
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
