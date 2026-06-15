import { NextResponse } from "next/server";

import { getPdsAdminAuth, getPdsServiceForCurrentUser } from "../helpers";
import { getActivePlanKey } from "@/actions/subscription";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";

export async function POST(req: Request) {
  try {
    const { useCount } = (await req.json()) as { useCount?: number };

    // Invites onboard other people — not available on single-account plans.
    const plan = getPlanCatalogEntry(await getActivePlanKey());
    if (plan.maxAccounts <= 1) {
      return NextResponse.json(
        {
          message: `Invites aren't available on the ${plan.name} plan. Upgrade to host more accounts.`,
        },
        { status: 403 },
      );
    }

    const { service } = await getPdsServiceForCurrentUser();
    const { pdsBaseUrl, authHeader } = getPdsAdminAuth(service);

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

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ message }, { status });
  }
}

