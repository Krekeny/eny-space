import { NextResponse } from "next/server";

import {
  remainingAccountSlots,
  getPdsAdminAuth,
  getPdsServiceForCurrentUser,
} from "../helpers";
import { getActivePlanKey } from "@/actions/subscription";
import { getPlanCatalogEntry } from "@/lib/plan-catalog";

const MAX_INVITE_USES = 50;

export async function POST(req: Request) {
  try {
    const { useCount } = (await req.json()) as { useCount?: number };

    const planKey = await getActivePlanKey();
    if (!planKey) {
      return NextResponse.json(
        { message: "No active subscription" },
        { status: 403 },
      );
    }

    const { service } = await getPdsServiceForCurrentUser();
    const { pdsBaseUrl, authHeader } = getPdsAdminAuth(service);

    const plan = getPlanCatalogEntry(planKey);
    const remaining = await remainingAccountSlots(pdsBaseUrl, authHeader, plan);
    if (remaining <= 0) {
      return NextResponse.json(
        {
          message: `Your ${plan.name} plan allows ${plan.maxAccounts} account${
            plan.maxAccounts === 1 ? "" : "s"
          }. Upgrade to host more.`,
        },
        { status: 403 },
      );
    }

    const requested =
      Number.isInteger(useCount) && (useCount as number) > 0
        ? (useCount as number)
        : 1;
    const grant = Math.min(
      requested,
      Number.isFinite(remaining) ? remaining : MAX_INVITE_USES,
    );

    const res = await fetch(
      `${pdsBaseUrl}/xrpc/com.atproto.server.createInviteCode`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ useCount: grant }),
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

