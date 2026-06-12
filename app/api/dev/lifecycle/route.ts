import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  getLifecycle,
  startPdsGrace,
  reactivatePds,
  resetPdsLifecycle,
  sweepLifecycles,
  ensureStubPdsRow,
} from "@/lib/pds-lifecycle-server";

export const dynamic = "force-dynamic";

// Dev-only control surface for the PDS lifecycle. Operates on the current
// user's PDS so the flow can be exercised without Stripe. 404 in production.

function isDev() {
  return process.env.NODE_ENV !== "production";
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  if (!isDev()) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ lifecycle: await getLifecycle(userId) });
}

export async function POST(req: Request) {
  if (!isDev()) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { action } = (await req.json().catch(() => ({}))) as { action?: string };

  let result: unknown;
  switch (action) {
    case "cancel":
      await ensureStubPdsRow(userId);
      result = await startPdsGrace(userId, "canceled");
      break;
    case "past_due":
      await ensureStubPdsRow(userId);
      result = await startPdsGrace(userId, "past_due");
      break;
    case "reactivate":
      result = await reactivatePds(userId);
      break;
    case "reset":
      result = await resetPdsLifecycle(userId);
      break;
    case "sweep":
      result = await sweepLifecycles();
      break;
    default:
      return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, result, lifecycle: await getLifecycle(userId) });
}
