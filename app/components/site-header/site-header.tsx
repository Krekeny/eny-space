"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/actions/auth";
import { Button } from "@/actions/components/ui/button";
import { ArrowUpRightIcon, MenuIcon, XIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const navLinkClass =
  "inline-flex h-9 items-center justify-center rounded-full bg-transparent px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/90 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

interface SiteHeaderProps {
  user: User | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-neutral-950">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          onClick={closeMobile}
        >
          <Image
            src="/logo.svg"
            alt=""
            width={40}
            height={40}
            className="shrink-0"
          />
          <span className="text-lg">eny.space</span>
        </Link>

        <nav className="hidden flex-1 justify-center gap-1 md:flex">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          {user && (
            <Link href="/dashboard" className={navLinkClass}>
              Dashboard
            </Link>
          )}
          <Link href="/#about" className={navLinkClass}>
            About
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <form action={signOut}>
              <Button
                type="submit"
                size="default"
                className="inline-flex items-center rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-white/90"
              >
                <span>Sign out</span>
                <ArrowUpRightIcon className="ml-1 size-3.5" aria-hidden />
              </Button>
            </form>
          ) : (
            <>
              <Button
                variant="outline"
                size="default"
                className="rounded-full border-white/20 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white/90 hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                size="default"
                className="rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-white/90"
                asChild
              >
                <Link href="/signup">
                  Get started
                  <ArrowUpRightIcon className="ml-1 size-3.5" aria-hidden />
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? (
            <XIcon className="size-4" aria-hidden />
          ) : (
            <MenuIcon className="size-4" aria-hidden />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-neutral-950 px-4 pb-4 pt-3 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="text-sm font-medium text-white/90"
              onClick={closeMobile}
            >
              Home
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white/90"
                onClick={closeMobile}
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/#about"
              className="text-sm font-medium text-white/90"
              onClick={closeMobile}
            >
              About
            </Link>
          </nav>

          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <form action={signOut}>
                <Button
                  type="submit"
                  size="default"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-white/90"
                >
                  <span>Sign out</span>
                  <ArrowUpRightIcon className="ml-1 size-3.5" aria-hidden />
                </Button>
              </form>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="default"
                  className="inline-flex h-9 w-full items-center justify-center rounded-full border-white/20 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white/90 hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/login" onClick={closeMobile}>
                    Login
                  </Link>
                </Button>
                <Button
                  size="default"
                  className="inline-flex h-9 w-full items-center justify-center rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-white/90"
                  asChild
                >
                  <Link href="/signup" onClick={closeMobile}>
                    Get started
                    <ArrowUpRightIcon className="ml-1 size-3.5" aria-hidden />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

