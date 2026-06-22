import { NextResponse } from "next/server";

import { sweepLifecycles } from "@/lib/pds-lifecycle-server";

export const dynamic = "force-dynamic";

// Required scheduled job (see vercel.json). Advances the subscription lifecycle.
// Protected by CRON_SECRET (Vercel Cron sends it as a Bearer token).

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
