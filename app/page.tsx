import { Hero } from "@/components/hero/hero";
import { LogoBar } from "@/components/logo-bar";
import { FeaturesSection } from "@/components/features";
import { PricingSection } from "@/components/pricing";
import { FAQSection } from "@/components/faq";
import { CTASection } from "@/components/cta";
import { PrelaunchSection } from "./components/prelaunch";

export default function Page() {
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
