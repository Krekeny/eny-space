import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { welcomePath } from "@/lib/onboarding";
import type {
  PdsLifecycleReason,
  PdsLifecycleStatus,
} from "@/lib/pds-lifecycle";

function fmtDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type NoticeProps = {
  reason: PdsLifecycleReason | null;
  graceUntil: string | null;
  deleteAt: string | null;
  pdsPlan?: string;
};

/** Banner shown above a read-only dashboard during the grace period. */
export function LifecycleGraceBanner({
  reason,
  graceUntil,
  deleteAt,
  pdsPlan,
}: NoticeProps) {
  const graceDate = fmtDate(graceUntil);
  const deleteDate = fmtDate(deleteAt);
  const headline =
    reason === "past_due"
      ? "Payment failed — your PDS is at risk"
      : "Subscription canceled";

  return (
    <div className="rounded-md border border-amber-400/40 bg-amber-400/10 p-4 text-amber-50">
      <Heading as="h2" className="text-sm font-semibold text-amber-200">
        {headline}
      </Heading>
      <Paragraph className="mt-1 text-sm text-amber-50/90">
        Your PDS is still reachable but read-only
        {graceDate ? ` until ${graceDate}` : ""}. After that it is switched off
        {deleteDate ? `, and permanently deleted on ${deleteDate}` : ""}.
        Resubscribe any time before then to restore full access — no data is
        lost.
      </Paragraph>
      <ButtonLink
        href={welcomePath({ pds_plan: pdsPlan })}
        className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
      >
        {reason === "past_due" ? "Update payment" : "Resubscribe"}
      </ButtonLink>
    </div>
  );
}

/** Full-screen state when the PDS is suspended or deleted. */
export function LifecycleBlocked({
  status,
  reason,
  deleteAt,
  pdsPlan,
}: NoticeProps & { status: Extract<PdsLifecycleStatus, "suspended" | "deleted"> }) {
  const deleteDate = fmtDate(deleteAt);
  const isDeleted = status === "deleted";

  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-8 text-center text-white">
      <Heading as="h2" className="text-lg font-semibold text-rose-300">
        {isDeleted ? "Your PDS was deleted" : "Your PDS is suspended"}
      </Heading>
      <Paragraph className="mx-auto mt-2 max-w-md text-sm text-white/70">
        {isDeleted
          ? "Your subscription ended and your PDS and its data have been permanently deleted. You can subscribe again to start fresh."
          : `Your subscription ended and your PDS has been switched off${
              reason === "past_due" ? " after a failed payment" : ""
            }. Your data is retained${
              deleteDate ? ` until ${deleteDate}` : ""
            } — resubscribe to restore it.`}
      </Paragraph>
      <ButtonLink
        href={welcomePath({ pds_plan: pdsPlan })}
        className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-neutral-950 hover:bg-primary/80"
      >
        {isDeleted ? "Get started" : "Resubscribe"}
      </ButtonLink>
    </div>
  );
}
