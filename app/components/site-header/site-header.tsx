"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/actions/auth";
import { Button } from "@/actions/components/ui/button";
import { ArrowUpRightIcon, MenuIcon, XIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { MobileMenu } from "./mobile-menu";

interface SiteHeaderProps {
  user: User | null;
  isRecovery?: boolean;
}

const headerCtaClass =
  "inline-flex items-center gap-1.5 rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 cursor-pointer hover:bg-primary/80";

export function SiteHeader({ user, isRecovery = false }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayText, setDisplayText] = useState(".");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let dotCycle = 1;
    let repeatCount = 0;
    const fullWord = "space";
    let charIndex = 0;

    const DOT_SPEED = 400;
    const CURSOR_BLINK_SPEED = 500;
    const TYPE_SPEED = 200;

    const dotInterval = setInterval(() => {
      if (dotCycle < 3) {
        dotCycle++;
      } else {
        dotCycle = 1;
        repeatCount++;
      }

      if (repeatCount < 2) {
        setDisplayText(".".repeat(dotCycle));
      } else {
        clearInterval(dotInterval);
        setDisplayText(".");

        let blinks = 0;
        const blinkInterval = setInterval(() => {
          setIsTyping((prev) => !prev);
          blinks++;

          if (blinks === 4) {
            clearInterval(blinkInterval);
            setIsTyping(true);

            const typeInterval = setInterval(() => {
              setDisplayText("." + fullWord.slice(0, charIndex + 1));
              charIndex++;

              if (charIndex === fullWord.length) {
                clearInterval(typeInterval);
                setTimeout(() => setIsTyping(false), 400);
              }
            }, TYPE_SPEED);
          }
        }, CURSOR_BLINK_SPEED);
      }
    }, DOT_SPEED);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            className="shrink-0"
          />

          {/* THE LAYOUT FIX IS HERE */}
          <div className="relative text-lg flex items-center tabular-nums">
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

        <div className="hidden items-center gap-2 md:flex">
          {user && !isRecovery ? (
            <>
              <Button size="default" className={headerCtaClass} asChild>
                <Link href="/dashboard">
                  Your PDS
                  <ArrowUpRightIcon className="ml-1 size-3.5" />
                </Link>
              </Button>
              <form action={signOut}>
                <Button
                  type="submit"
                  size="default"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white/70 cursor-pointer hover:border-white/60 hover:text-white"
                >
                  Sign out
                </Button>
              </form>
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
