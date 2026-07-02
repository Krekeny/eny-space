"use client";

import { useEffect, useRef, useState } from "react";
import { SupportDialog } from "@/components/support/support-dialog";
import { SUPPORT_MAILTO } from "@/lib/site-config";

export function BetaBadge({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = e.target as Element | null;
      // Keep the popover mounted while the feedback dialog (a portal) is open.
      if (el?.closest?.("[role='dialog']")) return;
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="What does beta mean?"
        className={`shrink-0 origin-center cursor-pointer self-center rounded border border-white/30 bg-white/10 px-2 py-0.5 font-heading text-xs uppercase leading-none tracking-widest text-white/80 transition-colors hover:border-white/50 hover:text-white ${
          open ? "" : "motion-safe:animate-beta-wiggle"
        }`}
      >
        Beta
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-white/10 bg-slate-900/95 p-4 text-left shadow-xl backdrop-blur">
          <p className="font-heading text-sm font-semibold text-white">
            We&apos;re in open beta
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/70">
            Expect the occasional breaking change, the dashboard and the
            services around your PDS may still be unstable.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            Your PDS itself is untouched and backed up, so{" "}
            <span className="text-white">no data is lost</span>.
          </p>
          <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-white/70">
            We want your feedback anytime — feature requests, questions,
            anything.{" "}
            {userEmail ? (
              <SupportDialog
                context="beta-popover"
                defaultCategory="feedback"
                userEmail={userEmail}
              >
                Send it here
              </SupportDialog>
            ) : (
              <a
                href={SUPPORT_MAILTO}
                className="underline decoration-dotted underline-offset-2 hover:text-white"
              >
                Email us
              </a>
            )}
            .
          </p>
        </div>
      )}
    </div>
  );
}
