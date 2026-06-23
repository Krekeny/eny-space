"use client";

import { cn } from "@/actions/lib/utils";
import { ChevronDownIcon, TriangleAlertIcon } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  warn?: boolean;
  /** Icon color: amber for an upcoming issue, red for one already in effect. */
  warnTone?: "warning" | "danger";
  warnLabel?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className,
  warn = false,
  warnTone = "warning",
  warnLabel = "Needs attention",
}: CollapsibleSectionProps) {
  return (
    <details
      open={defaultOpen}
      className={cn("group rounded-md border border-white/10 bg-white/5 backdrop-blur-xl", className)}
    >
      <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white transition-colors">
        <span className="flex items-center gap-2">
          {title}
          {warn && (
            <TriangleAlertIcon
              className={cn(
                "size-4",
                warnTone === "danger" ? "text-rose-500" : "text-amber-400",
              )}
              aria-label={warnLabel}
            />
          )}
        </span>
        <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/10 px-4 py-4">
        {children}
      </div>
    </details>
  );
}
