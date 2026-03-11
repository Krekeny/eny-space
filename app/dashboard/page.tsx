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

  return (
    <main className="flex flex-col gap-6 px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Welcome back, {user.email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardClient
            subscribed={subscribed}
            subscription={subscription}
            priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || ""}
          />
        </CardContent>
      </Card>
    </main>
  );
}
