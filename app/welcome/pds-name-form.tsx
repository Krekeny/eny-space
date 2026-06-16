"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionCheckout } from "@/actions/subscription";
import { Button } from "@/actions/components/ui/button";
import { Input } from "@/actions/components/ui/input";
import { Label } from "@/actions/components/ui/label";
import { Paragraph } from "@/components/paragraph";
import { validatePdsSlugInput } from "@/lib/pds-slug";
import { welcomePath } from "@/lib/onboarding";

type Availability = "idle" | "checking" | "available" | "taken" | "blocked";

type PdsNameFormProps = {
  pdsPlan: string;
  /** When set, this is a resubscribe: lock to the user's existing PDS name. */
  lockedName?: string;
};

export function PdsNameForm({ pdsPlan, lockedName }: PdsNameFormProps) {
  const router = useRouter();
  const locked = !!lockedName;
  const [name, setName] = useState(lockedName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<Availability>(
    locked ? "available" : "idle",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validation = validatePdsSlugInput(name);
  const preview = validation.ok ? validation.hostname : null;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // The user's own existing PDS is always "available" to them — skip the check.
    if (locked) {
      setAvailability("available");
      return;
    }

    if (!preview) {
      setAvailability("idle");
      return;
    }

    setAvailability("checking");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/pds/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostname: preview }),
        });
        const data = await res.json();
        setAvailability(
          data.blocked ? "blocked" : data.exists ? "taken" : "available",
        );
      } catch {
        setAvailability("idle");
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [preview, locked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    if (availability === "taken") {
      setError("This name is already taken. Please choose another.");
      return;
    }

    if (availability === "blocked") {
      setError("This name is not allowed. Please choose another.");
      return;
    }

    setLoading(true);
    try {
      const { url } = await createSubscriptionCheckout(pdsPlan, validation.slug);
      if (url) {
        window.location.href = url;
        return;
      }
      setError("Could not start checkout. Please try again.");
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start checkout. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pds-name" className="text-white">
          PDS name
        </Label>
        <Input
          id="pds-name"
          name="pds-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-handle"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="bg-white/10 text-white placeholder:text-white/40 disabled:opacity-100 read-only:opacity-70"
          disabled={loading}
          readOnly={locked}
          required
        />
        <Paragraph className="text-xs text-white/60">
          {locked
            ? "This is your existing PDS — resubscribe to bring it back online."
            : "Letters, numbers, and hyphens. This becomes your hosting username and part of your PDS URL."}
        </Paragraph>
      </div>

      {preview && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/70 font-mono">{preview}</span>
          {availability === "checking" && (
            <span className="text-white/40 text-xs">Checking…</span>
          )}
          {availability === "available" && (
            <span className="text-emerald-400 text-xs">Available</span>
          )}
          {availability === "taken" && (
            <span className="text-rose-400 text-xs">Already taken</span>
          )}
          {availability === "blocked" && (
            <span className="text-rose-400 text-xs">Not allowed</span>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-md bg-destructive/20 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          className="rounded-full border border-white/40 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white hover:bg-white/10"
          onClick={() => router.push(welcomePath({ pds_plan: pdsPlan }))}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={
            loading ||
            availability === "checking" ||
            availability === "taken" ||
            availability === "blocked"
          }
          className="rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80 disabled:opacity-50"
        >
          {loading
            ? "Redirecting…"
            : locked
              ? "Resubscribe"
              : "Continue to payment"}
        </Button>
      </div>
    </form>
  );
}
