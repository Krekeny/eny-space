"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionCheckout } from "@/actions/subscription";
import { Button } from "@/actions/components/ui/button";
import { Input } from "@/actions/components/ui/input";
import { Label } from "@/actions/components/ui/label";
import { Paragraph } from "@/components/paragraph";
import { validatePdsSlugInput } from "@/lib/pds-slug";
import { disksizeGbForPlan } from "@/lib/plan-catalog";
import { welcomePath } from "@/lib/onboarding";

type PdsNameFormProps = {
  priceId: string;
  pdsPlan?: string;
  pdsDisksizeGb?: string;
};

export function PdsNameForm({ priceId, pdsPlan, pdsDisksizeGb }: PdsNameFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => {
    const result = validatePdsSlugInput(name);
    return result.ok ? result.hostname : null;
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!priceId) {
      setError(
        "Stripe price is not configured. Contact support or try again later.",
      );
      return;
    }

    const validation = validatePdsSlugInput(name);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    try {
      const { url } = await createSubscriptionCheckout(priceId, {
        username: validation.slug,
        disksizeGb: disksizeGbForPlan(pdsPlan, pdsDisksizeGb),
        planKey: pdsPlan,
      });
      if (url) {
        window.location.href = url;
        return;
      }
      setError("Could not start checkout. Please try again.");
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start checkout. Please try again.",
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
          className="bg-white/10 text-white placeholder:text-white/40"
          disabled={loading}
          required
        />
        <Paragraph className="text-xs text-white/60">
          Letters, numbers, and hyphens. This becomes your hosting username and
          part of your PDS URL.
        </Paragraph>
      </div>

      {preview && (
        <Paragraph className="text-sm text-white/80">
          Your PDS will be provisioned at{" "}
          <span className="font-mono text-white">{preview}</span>
        </Paragraph>
      )}

      {error && (
        <p className="rounded-md bg-destructive/20 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          type="submit"
          disabled={loading}
          className="rounded-full bg-white px-4 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
        >
          {loading ? "Redirecting…" : "Continue to payment"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          className="rounded-full border border-white/40 bg-transparent px-4 text-xs font-medium uppercase tracking-wide text-white hover:bg-white/10"
          onClick={() =>
            router.push(
              welcomePath({
                pds_plan: pdsPlan,
                pds_disksize_gb: pdsDisksizeGb,
              }),
            )
          }
        >
          Back
        </Button>
      </div>
    </form>
  );
}
