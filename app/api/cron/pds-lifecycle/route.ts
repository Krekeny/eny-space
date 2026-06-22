import { NextResponse } from "next/server";

import { sweepLifecycles } from "@/lib/pds-lifecycle-server";

export const dynamic = "force-dynamic";

// Advances the persisted lifecycle label (grace -> suspended -> deleted) AND,
// when a row first crosses grace -> suspended, fires the infra DELETE that takes
// the pod down (with termination_date = delete_at). This is REQUIRED: nothing
// else triggers the post-grace teardown, so without this cron running a
// cancellation stays in grace forever (pod up, never deleted).
//
// Scheduled hourly via vercel.json. Protected with CRON_SECRET (Vercel Cron
// sends `Authorization: Bearer $CRON_SECRET` automatically when it's set).
// Manual trigger:
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/pds-lifecycle

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await sweepLifecycles();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[lifecycle] sweep failed", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
