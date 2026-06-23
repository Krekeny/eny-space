import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { subscribePath, type OnboardingSearchParams } from "@/lib/onboarding";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<
    OnboardingSearchParams & {
      message?: string;
    }
  >;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const onboarding = { pds_plan: params?.pds_plan };
  // (active / grace / suspended / onboarding). Only continue into the subscribe
  const next = params?.pds_plan ? subscribePath(onboarding) : "/dashboard";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(next);
  }
  const signupQs = new URLSearchParams();
  if (params?.pds_plan) signupQs.set("pds_plan", params.pds_plan);
  const signupHref = `/signup${signupQs.toString() ? `?${signupQs}` : ""}`;

  return (
    <LoginForm
      next={next}
      signupHref={signupHref}
      passwordResetSuccess={params?.message === "password-reset"}
    />
  );
}
