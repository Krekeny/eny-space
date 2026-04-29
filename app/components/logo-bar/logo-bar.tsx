import Link from "next/link";
import {
  BoxIcon,
  CircleIcon,
  HexagonIcon,
  LayersIcon,
  SparklesIcon,
  SquareIcon,
  CircleDotIcon,
} from "lucide-react";
import { Paragraph } from "@/components/paragraph";

const PLACEHOLDER_LINKS = [
  { label: "Short", href: "#", icon: BoxIcon },
  { label: "Medium Label", href: "#", icon: SparklesIcon },
  { label: "Descriptive Text", href: "#", icon: CircleIcon },
  { label: "Another Link", href: "#", icon: LayersIcon },
  { label: "Quick Label", href: "#", icon: CircleDotIcon },
  { label: "Label Name Text", href: "#", icon: SquareIcon },
  { label: "Final Example", href: "#", icon: HexagonIcon },
];

function LogoBarItem({
  item,
}: {
  item: (typeof PLACEHOLDER_LINKS)[number];
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex shrink-0 items-center gap-3 text-base font-medium text-white/90 transition-colors hover:text-white"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
        <Icon className="size-5 text-white/90" aria-hidden />
      </span>
      {item.label}
    </Link>
  );
}

function LogoBarScroll() {
  return (
    <div className="relative w-full overflow-hidden py-8 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-marquee items-center [transform:translateZ(0)]">
        {["a", "b"].map((blockId) => (
          <div
            key={blockId}
            className="flex shrink-0 items-center gap-16 whitespace-nowrap"
          >
            {PLACEHOLDER_LINKS.slice(0, 6).map((item, i) => (
              <LogoBarItem key={`${blockId}-${i}`} item={item} />
            ))}
            <div className="flex shrink-0 items-center">
              <LogoBarItem
                key={`${blockId}-6`}
                item={PLACEHOLDER_LINKS[6]}
              />
              <span className="w-16 shrink-0" aria-hidden />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogoBar() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Paragraph className="mx-auto max-w-2xl text-center text-base text-white/60">
          Built for AT Protocol and Bluesky power users who want to see and
          manage their Personal Data Server through a modern interface instead
          of raw APIs and command‑line tools.
        </Paragraph>
        <LogoBarScroll />
      </div>
    </section>
  );
}
