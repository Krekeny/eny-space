"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircleIcon, XIcon } from "lucide-react";
import { submitFeedback } from "@/actions/feedback";
import { Button } from "@/actions/components/ui/button";
import { Textarea } from "@/actions/components/ui/textarea";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";

type Category = "support" | "bug" | "feedback";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "support", label: "I need help" },
  { value: "bug", label: "Something's broken" },
  { value: "feedback", label: "Feedback / idea" },
];

type SupportDialogProps = {
  /** Trigger text. Defaults to "contact support". */
  children?: React.ReactNode;
  /** Where it was opened from, stored with the feedback (e.g. "pds-setup-error"). */
  context?: string;
  /** Preselected category. */
  defaultCategory?: Category;
  /** Shown so the user knows we already have their identity. */
  userEmail?: string | null;
  /** Extra context lines to show (e.g. PDS name + status). */
  details?: { label: string; value?: string | null }[];
  /** "link" = inline dotted text (default); "fab" = floating action button. */
  variant?: "link" | "fab";
};

export function SupportDialog({
  children,
  context,
  defaultCategory = "support",
  userEmail,
  details,
  variant = "link",
}: SupportDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    // Reset after the overlay is gone so it doesn't flicker while closing.
    setTimeout(() => {
      setMessage("");
      setError(null);
      setDone(false);
      setCategory(defaultCategory);
    }, 150);
  }, [defaultCategory]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);
    setError(null);
    const res = await submitFeedback({ message, category, context });
    setLoading(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Something went wrong.");
  };

  return (
    <>
      {variant === "fab" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Say hello"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/90 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur transition-colors hover:border-white/30 hover:bg-slate-800"
        >
          <MessageCircleIcon className="size-4" aria-hidden />
          <span className="hidden sm:inline">{children ?? "Say hi"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="underline decoration-dotted underline-offset-2 transition-colors hover:text-white"
        >
          {children ?? "contact support"}
        </button>
      )}

      {open &&
        mounted &&
        createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Contact support"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <XIcon className="size-4" aria-hidden />
            </button>

            {done ? (
              <div className="space-y-4 text-center">
                <Heading as="h2" className="text-xl font-semibold">
                  Thanks — we got it.
                </Heading>
                <Paragraph className="text-sm text-white/60">
                  We&apos;ll get back to you at your account email.
                </Paragraph>
                <Button onClick={close} className="w-full">
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Heading as="h2" className="text-xl font-semibold">
                    Contact support
                  </Heading>
                  <Paragraph className="mt-1 text-sm text-white/60">
                    Tell us what&apos;s going on and we&apos;ll help.
                  </Paragraph>
                </div>

                {(userEmail || details?.some((d) => d.value)) && (
                  <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
                    <p className="text-white/40">
                      We already know it&apos;s you — no need to add your details.
                    </p>
                    {userEmail && (
                      <p>
                        Signed in as{" "}
                        <span className="text-white/80">{userEmail}</span>
                      </p>
                    )}
                    {details
                      ?.filter((d) => d.value)
                      .map((d) => (
                        <p key={d.label}>
                          {d.label}:{" "}
                          <span className="text-white/80">{d.value}</span>
                        </p>
                      ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor={`${titleId}-cat`}
                    className="text-xs font-medium text-white/60"
                  >
                    Topic
                  </label>
                  <select
                    id={`${titleId}-cat`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus-visible:border-white/30"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-slate-900">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`${titleId}-msg`}
                    className="text-xs font-medium text-white/60"
                  >
                    Message
                  </label>
                  <Textarea
                    id={`${titleId}-msg`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    maxLength={4000}
                    required
                    autoFocus
                    placeholder="Describe the problem or share your feedback…"
                  />
                </div>

                {error && (
                  <p className="text-sm text-rose-300" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !message.trim()}>
                    {loading ? "Sending…" : "Send"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
