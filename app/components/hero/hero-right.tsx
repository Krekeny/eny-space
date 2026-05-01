import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { prelaunch } from "@/lib/prelaunch";

const navItems = [
  { label: "Key features", href: "/#features" },
  ...(!prelaunch ? [{ label: "Pricing", href: "/#pricing" }] : []),
  { label: "FAQs", href: "/#faq" },
];

export function HeroRight() {
  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/#discover"
        className="border-b border-white/60 pb-1 text-sm font-medium uppercase tracking-wide text-white hover:border-white hover:text-white"
      >
        /// Discover eny.space
      </Link>
      <ul className="mt-4 flex flex-col gap-3">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-white/90 transition-colors hover:text-white"
            >
              {item.label}
              <ChevronDownIcon className="size-4" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
