import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SignUpForm } from "./signup-form";
import { welcomePath, type OnboardingSearchParams } from "@/lib/onboarding";

type SignUpPageProps = {
  searchParams?: Promise<OnboardingSearchParams>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const onboarding = { pds_plan: params?.pds_plan };
  const next = welcomePath(onboarding);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(next);
  }
  const loginQs = new URLSearchParams();
  if (params?.pds_plan) loginQs.set("pds_plan", params.pds_plan);
  const loginHref = `/login${loginQs.toString() ? `?${loginQs}` : ""}`;

  return (
    <Suspense>
      <SignUpForm next={next} loginHref={loginHref} />
    </Suspense>
  );
}
