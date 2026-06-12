import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { getPdsAdminAuth, getPdsServiceForCurrentUser } from "../helpers";

async function generateInviteCode(pdsBaseUrl: string, authHeader: string): Promise<string> {
  const res = await fetch(`${pdsBaseUrl}/xrpc/com.atproto.server.createInviteCode`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({ useCount: 1 }),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate invite code (${res.status})`);
  }
  const data = await res.json();
  const code = data?.code || data?.inviteCode;
  if (!code) throw new Error("Invite code missing from response");
  return code;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      handle: string;
      password: string;
    };

    if (!body?.handle || !body?.password) {
      return NextResponse.json(
        { message: "Missing required fields: handle, password" },
        { status: 400 },
      );
    }

    const { service } = await getPdsServiceForCurrentUser();
    const { pdsBaseUrl, authHeader } = getPdsAdminAuth(service);

    let emailToUse = body.email;
    if (!emailToUse) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        return NextResponse.json(
          { message: "Missing email: provide one in the request or ensure a Supabase user is logged in" },
          { status: 400 },
        );
      }
      const [local, domain] = user.email.split("@");
      emailToUse = `${local}+pds-${Date.now()}@${domain}`;
    }

    const inviteCode = await generateInviteCode(pdsBaseUrl, authHeader);

    const res = await fetch(`${pdsBaseUrl}/xrpc/com.atproto.server.createAccount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailToUse,
        handle: body.handle,
        password: body.password,
        inviteCode,
      }),
    });

    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await res.json()
      : await res.text().catch(() => "");

    if (!res.ok) {
      return NextResponse.json(
        { message: "Failed to create account", status: res.status, payload },
        { status: 502 },
      );
    }

    if (payload && typeof payload === "object") {
      return NextResponse.json({ ...(payload as any), emailUsed: emailToUse });
    }

    return NextResponse.json({ payload, emailUsed: emailToUse });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ message }, { status });
  }
}
