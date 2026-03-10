import { Hero } from "@/components/hero/hero";
import { LogoBar } from "@/components/logo-bar";
import { FeaturesSection } from "@/components/features";
import { PricingSection } from "@/components/pricing";
import { TestimonialsSection } from "@/components/testimonials";
import { FAQSection } from "@/components/faq";

export default function Page() {
  return (
    <>
      <Hero />
      <LogoBar />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}
