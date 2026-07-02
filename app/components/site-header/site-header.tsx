"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { Button } from "@/actions/components/ui/button";
import { ArrowUpRightIcon, MenuIcon, XIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { MobileMenu } from "./mobile-menu";
import { BetaBadge } from "./beta-badge";

interface SiteHeaderProps {
  user: User | null;
  isRecovery?: boolean;
}

const headerCtaClass =
  "inline-flex items-center gap-1.5 rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 cursor-pointer hover:bg-primary/80";

export function SiteHeader({ user, isRecovery = false }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // sync initial state (e.g. reload while scrolled down)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fullWord = ".space";
    let charIndex = 0;

    const CURSOR_BLINK_SPEED = 500;
    const TYPE_SPEED = 200;

    let typeInterval: ReturnType<typeof setInterval>;

    // Blink the cursor a few times, then type out "space".
    let blinks = 0;
    setIsTyping(true);
    const blinkInterval = setInterval(() => {
      setIsTyping((prev) => !prev);
      blinks++;

      if (blinks === 4) {
        clearInterval(blinkInterval);
        setIsTyping(true);

        typeInterval = setInterval(() => {
          setDisplayText(fullWord.slice(0, charIndex + 1));
          charIndex++;

          if (charIndex === fullWord.length) {
            clearInterval(typeInterval);
            setTimeout(() => setIsTyping(false), 400);
          }
        }, TYPE_SPEED);
      }
    }, CURSOR_BLINK_SPEED);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(typeInterval);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "px-3 pt-3" : "px-0 pt-0"
      }`}
    >
      <div
        className={`relative mx-auto flex items-center justify-between gap-4 border transition-all duration-300 ${
          scrolled
            ? "h-12 max-w-2xl rounded-full border-white/10 bg-slate-950/85 px-5 shadow-lg shadow-black/30 backdrop-blur-md"
            : "h-14 max-w-7xl rounded-none border-transparent bg-transparent px-4 sm:px-6"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            onClick={() => setMobileOpen(false)}
          >
          {/* Decorative animated pixel planet — plain img so SMIL plays. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pixel-planet.svg"
            alt=""
            aria-hidden
            width={32}
            height={32}
            className="shrink-0"
          />

          {/* THE LAYOUT FIX IS HERE */}
          <div className="relative text-2xl flex items-center tabular-nums font-heading">
            {/* Hidden ghost text that reserves the full width of "eny.space" */}
            <span
              className="invisible pointer-events-none select-none"
              aria-hidden="true"
            >
              eny.space
            </span>

            {/* The actual visible animated text */}
            <div className="absolute left-0 flex items-center whitespace-nowrap">
              <span>eny{displayText}</span>
              <span
                className={`ml-0.5 transition-opacity duration-100 ${isTyping ? "opacity-100" : "opacity-0"}`}
              >
                _
              </span>
            </div>
          </div>
          </Link>
          <BetaBadge userEmail={user?.email ?? null} />
        </div>

        {/* Centered nav — absolutely centered so it stays mid-bar regardless of
            the logo / CTA cluster widths. */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <Link
            href="/blog"
            className="text-xs font-medium uppercase tracking-wide text-white/50 transition-colors hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            Blog
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user && !isRecovery ? (
            <>
              <Button size="default" className={headerCtaClass} asChild>
                <Link href="/dashboard">
                  Your PDS
                  <ArrowUpRightIcon className="ml-1 size-3.5" />
                </Link>
              </Button>
              <div className="group relative">
                <form action={signOut}>
                  <Button
                    type="submit"
                    size="default"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white/70 cursor-pointer hover:border-white/60 hover:text-white"
                  >
                    Sign out
                  </Button>
                </form>
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-md border border-white/10 bg-slate-900/95 px-3 py-1.5 text-xs text-white/80 opacity-0 shadow-lg backdrop-blur transition-opacity duration-150 group-hover:opacity-100">
                  Signed in as{" "}
                  <span className="font-medium text-white">
                    {user.email ?? "your account"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <Button
                size="default"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white/70 cursor-pointer hover:border-white/60 hover:text-white"
                asChild
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                size="default"
                className={headerCtaClass}
                asChild
              >
                <Link href="/signup">
                  Get started
                  <ArrowUpRightIcon className="ml-1 size-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-white md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? (
            <XIcon className="size-5" aria-hidden />
          ) : (
            <MenuIcon className="size-5" aria-hidden />
          )}
        </button>
      </div>

      <MobileMenu
        user={user}
        isRecovery={isRecovery}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </header>
  );
}
