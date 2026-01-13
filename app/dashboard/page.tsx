import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus, syncSubscriptionFromCheckoutSession } from "@/actions/subscription";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  
  // If we have a session_id, try to sync the subscription (fallback if webhook hasn't fired)
  if (params.session_id) {
    await syncSubscriptionFromCheckoutSession(params.session_id);
  }

  const { subscribed, subscription } = await getSubscriptionStatus();

  return (
    <main className="page-container">
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
