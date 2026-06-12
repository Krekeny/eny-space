import { NextResponse } from "next/server";

import { sweepLifecycles } from "@/lib/pds-lifecycle-server";

export const dynamic = "force-dynamic";

// Advances the persisted lifecycle label (grace -> suspended -> deleted) based
// on the stored timestamps. The actual infra suspension/deletion is handled by
// the backend via the termination_date set when grace started; this sweep keeps
// our DB (and therefore the access gating) in sync.
//
// Protect with CRON_SECRET. Trigger from any scheduler, or manually:
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
