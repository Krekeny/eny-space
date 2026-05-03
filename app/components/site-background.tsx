"use client";

import { usePathname } from "next/navigation";
import { HeroBackground } from "@/components/hero";

export function SiteBackground() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return <HeroBackground showPlanets={isLanding} />;
}

