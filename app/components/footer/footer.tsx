import Link from "next/link";
import Image from "next/image";
import { Paragraph } from "@/components/paragraph";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="eny.space"
            width={32}
            height={32}
            className="shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">eny.space</span>
            <Paragraph className="text-xs text-white/60">
              © {year} eny.space. All rights reserved.
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
          </nav>
        </div>
      </div>
    </footer>
  );
}
