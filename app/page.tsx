import { redirect } from "next/navigation";
import { Hero } from "@/components/hero/hero";
import { LogoBar } from "@/components/logo-bar";
import { FeaturesSection } from "@/components/features";
import { PricingSection } from "@/components/pricing";
import { FAQSection } from "@/components/faq";
import { CTASection } from "@/components/cta";
import { PrelaunchSection } from "./components/prelaunch";

type HomePageProps = {
  searchParams?: Promise<{
    code?: string;
    type?: string;
    next?: string;
  }>;
};

export default async function Page({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const code = params?.code;

  // Supabase may fall back to Site URL (/?code=...) when redirectTo is rejected.
  if (code) {
    const qs = new URLSearchParams({ code });
    if (params?.type) qs.set("type", params.type);
    const type = params?.type;
    const callbackPath =
      type === "signup" || type === "email"
        ? "/auth/confirm-callback"
        : "/auth/reset-callback";
    redirect(`${callbackPath}?${qs.toString()}`);
  }

  return (
    <>
      <Hero />
      <LogoBar />
      <FeaturesSection />
      <PrelaunchSection /> <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
