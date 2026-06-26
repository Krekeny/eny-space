import Link from "next/link";
import { Paragraph } from "@/components/paragraph";
import { LEGAL_NOTICE_URL, PRIVACY_POLICY_URL } from "@/lib/site-config";
import { APP_VERSION } from "@/lib/version";

export function Footer({ fabInset = false }: { fabInset?: boolean }) {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/90">
      <div
        className={`mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
          fabInset ? "pb-28 sm:pb-24" : "pb-8"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pixel-planet.svg"
            alt=""
            aria-hidden
            width={32}
            height={32}
            className="shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">eny.space</span>
            <Paragraph className="text-xs text-white/60">
              © {year} eny.space. All rights reserved.
            </Paragraph>
            <Paragraph className="text-xs text-white/40">
              eny.space is a brand of krekeny GmbH.
            </Paragraph>
            <Paragraph className="font-mono text-[10px] text-white/30">
              v{APP_VERSION}
            </Paragraph>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
          <nav className="flex flex-wrap items-center gap-4">
            <Link href="/#features" className="hover:text-white">
              Features
            </Link>
            <Link href="/#pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/#faq" className="hover:text-white">
              FAQ
            </Link>
            <a
              href={LEGAL_NOTICE_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              Impressum
            </a>
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              Privacy
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
