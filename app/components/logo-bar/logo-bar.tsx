"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { Paragraph } from "@/components/paragraph";
import { SUPPORT_MAILTO } from "@/lib/site-config";

const ATMOSPHERE_APPS: { label: string; href?: string; icon: string }[] = [
  {
    label: "Anisota",
    href: "https://anisota.net",
    icon: "/atmosphere-icons/logo-anisota.svg",
  },
  {
    label: "Blacksky",
    href: "https://blackskyweb.xyz",
    icon: "/atmosphere-icons/logo-blacksky.svg",
  },
  {
    label: "Blento",
    href: "https://blento.app",
    icon: "/atmosphere-icons/logo-blento.svg",
  },
  {
    label: "Bluesky",
    href: "https://bsky.app",
    icon: "/atmosphere-icons/logo-bluesky.svg",
  },
  {
    label: "Bookhive",
    href: "https://bookhive.buzz",
    icon: "/atmosphere-icons/logo-bookhive.svg",
  },
  {
    label: "Eurosky",
    href: "https://eurosky.tech/",
    icon: "/atmosphere-icons/logo-eurosky.svg",
  },
  {
    label: "Grain",
    href: "https://grain.social",
    icon: "/atmosphere-icons/logo-grain.svg",
  },
  {
    label: "Graze",
    href: "https://graze.social",
    icon: "/atmosphere-icons/logo-graze.svg",
  },
  {
    label: "Leaflet",
    href: "https://leaflet.pub",
    icon: "/atmosphere-icons/logo-leaflet.svg",
  },
  {
    label: "Margin",
    href: "https://margin.at/",
    icon: "/atmosphere-icons/logo-margin.svg",
  },
  {
    label: "Offprint",
    href: "https://offprint.app",
    icon: "/atmosphere-icons/logo-offprint.svg",
  },
  {
    label: "Pckt",
    href: "https://pckt.blog",
    icon: "/atmosphere-icons/logo-pckt.svg",
  },
  {
    label: "PDSls",
    href: "https://pdsls.dev",
    icon: "/atmosphere-icons/logo-pdsls.svg",
  },
  {
    label: "Plyr.fm",
    href: "https://plyr.fm",
    icon: "/atmosphere-icons/logo-plyr.fm.svg",
  },
  {
    label: "Popfeed",
    href: "https://popfeed.social",
    icon: "/atmosphere-icons/logo-popfeed.svg",
  },
  {
    label: "Roomy",
    href: "https://a.roomy.space/",
    icon: "/atmosphere-icons/logo-roomy.svg",
  },
  {
    label: "Semble",
    href: "https://semble.so/",
    icon: "/atmosphere-icons/logo-semble.svg",
  },
  {
    label: "Sifa.id",
    href: "https://sifa.id",
    icon: "/atmosphere-icons/logo-sifa%20id.svg",
  },
  {
    label: "Sill",
    href: "https://sill.social",
    icon: "/atmosphere-icons/logo-sill.svg",
  },
  {
    label: "Spark",
    href: "https://sprk.so/",
    icon: "/atmosphere-icons/logo-spark.svg",
  },
  {
    label: "Surf",
    href: "https://surf.social",
    icon: "/atmosphere-icons/logo-surf.svg",
  },
  {
    label: "Tangled",
    href: "https://tangled.org",
    icon: "/atmosphere-icons/logo-tangled.svg",
  },
];

function LogoBarItem({ item }: { item: (typeof ATMOSPHERE_APPS)[number] }) {
  const inner = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.icon} alt="" className="size-6" aria-hidden />
      </span>
      {item.label}
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-3 text-base font-medium text-white/90 transition-colors hover:text-white"
      >
        {inner}
      </Link>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-3 text-base font-medium text-white/50 cursor-default">
      {inner}
    </span>
  );
}

function LogoBarScroll() {
  const [shuffled, setShuffled] = useState(ATMOSPHERE_APPS);

  useEffect(() => {
    setShuffled((prev) => [...prev].sort(() => Math.random() - 0.5));
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-8 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-marquee items-center [transform:translateZ(0)]">
        {["a", "b"].map((blockId) => (
          <div
            key={blockId}
            className="flex shrink-0 items-center gap-16 whitespace-nowrap"
          >
            {shuffled.map((item, i) => (
              <LogoBarItem key={`${blockId}-${i}`} item={item} />
            ))}
            <span className="w-16 shrink-0" aria-hidden />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LogoBar() {
  const [open, setOpen] = useState(false);

  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Paragraph className="mx-auto max-w-2xl text-center text-base text-white/60">
          Built for AT Protocol and Bluesky power users who want to see and
          manage their Personal Data Server through a modern interface instead
          of raw APIs and command‑line tools.{" "}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label="Your tool isn't listed?"
            className="inline-flex size-5 translate-y-0.5 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
          >
            <ChevronDownIcon
              className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </Paragraph>

        {open && (
          <Paragraph className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/50">
            Your atmosphere tool or platform isn&apos;t listed?{" "}
            <a href={SUPPORT_MAILTO} className="text-primary hover:underline">
              Contact us
            </a>
            . Soon you&apos;ll be able to open a PR.
          </Paragraph>
        )}

        <LogoBarScroll />
      </div>
    </section>
  );
}
