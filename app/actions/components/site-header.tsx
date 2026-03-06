import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/actions/auth";
import { Button } from "@/actions/components/ui/button";
import { ArrowUpRightIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const navLinkClass =
  "inline-flex h-9 items-center justify-center rounded-full bg-transparent px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/90 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

interface SiteHeaderProps {
  user: User | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-neutral-950">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          <Image
            src="/logo.svg"
            alt=""
            width={48}
            height={48}
            className="shrink-0"
          />
          <span className="text-lg">eny.space</span>
        </Link>

        {/* Center nav */}
        <nav className="flex flex-1 justify-center gap-1">
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

        {/* Right – action buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
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
            </>
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
      </div>
    </header>
  );
}
