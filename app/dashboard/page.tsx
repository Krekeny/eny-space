import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/actions/subscription";
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
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      <DashboardClient
        subscribed={subscribed}
        subscription={subscription}
        priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || ""}
      />
    </main>
  );
}
