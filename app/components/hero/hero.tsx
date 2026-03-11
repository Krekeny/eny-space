import Image from "next/image";
import { HeroBackground } from "./hero-background";
import { HeroLeft } from "./hero-left";
import { HeroRight } from "./hero-right";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col justify-end overflow-hidden px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
      <HeroBackground />
      {/* Centered hero logo */}
      <div className="pointer-events-none absolute inset-0 -z-5 flex items-center justify-center opacity-15">
        <Image
          src="/logo.svg"
          alt="eny.space"
          width={520}
          height={520}
          className="shrink-0"
        />
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-12 md:grid-cols-[1fr_auto] md:items-center md:gap-16">
        <HeroLeft />
        <HeroRight />
      </div>
    </section>
  );
}
