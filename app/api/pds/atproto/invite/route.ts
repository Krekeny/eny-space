import { NextResponse } from "next/server";

import {
  assertCanAddAccount,
  getPdsAdminAuth,
  getPdsServiceForCurrentUser,
} from "../helpers";
import { getActivePlanKey } from "@/actions/subscription";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";

export async function POST(req: Request) {
  try {
    const { useCount } = (await req.json()) as { useCount?: number };

    const { service } = await getPdsServiceForCurrentUser();
    const { pdsBaseUrl, authHeader } = getPdsAdminAuth(service);

    // Gate by the plan's account limit (an invite fills the same limit as a
    // direct create). This still allows a migration code while the single slot
    // is open, but blocks once the limit is reached.
    const plan = getPlanCatalogEntry(await getActivePlanKey());
    await assertCanAddAccount(pdsBaseUrl, plan);

    const res = await fetch(
      `${pdsBaseUrl}/xrpc/com.atproto.server.createInviteCode`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ useCount: useCount ?? 1 }),
      },
    );

    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await res.json()
      : await res.text().catch(() => "");

    if (!res.ok) {
      return NextResponse.json(
        { message: "Failed to create invite", status: res.status, payload },
        { status: 502 },
      );
    }

    const p = (payload ?? {}) as { code?: string; inviteCode?: string };
    return NextResponse.json({ code: p.code ?? p.inviteCode ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ message }, { status });
  }
}

