import { NextResponse } from "next/server";

import {
  getPdsBaseUrlFromService,
  getPdsServiceForCurrentUser,
} from "../helpers";

// Email confirmation is account-scoped: com.atproto.server.requestEmailConfirmation
// and confirmEmail both require the account's OWN access token — admin creds can't
// trigger them. So we authenticate as the account (its password), then either send
// the confirmation code or submit it. The PDS is resolved from the caller's session,
// so this only works for accounts on the caller's own server.
export async function POST(req: Request) {
  try {
    const { identifier, password, action, token, email } = (await req.json()) as {
      identifier?: string;
      password?: string;
      action?: "request" | "confirm";
      token?: string;
      email?: string;
    };

    if (!identifier || !password || !action) {
      return NextResponse.json(
        { message: "identifier, password and action are required" },
        { status: 400 },
      );
    }

    const { service } = await getPdsServiceForCurrentUser();
    const pdsBaseUrl = getPdsBaseUrlFromService(service);

    // Authenticate as the account.
    const sessionRes = await fetch(
      `${pdsBaseUrl}/xrpc/com.atproto.server.createSession`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      },
    );
    const sessionBody = (await sessionRes.json().catch(() => ({}))) as {
      accessJwt?: string;
      message?: string;
    };
    if (!sessionRes.ok || !sessionBody.accessJwt) {
      return NextResponse.json(
        { message: sessionBody.message || "Invalid account credentials" },
        { status: 401 },
      );
    }
    const auth = `Bearer ${sessionBody.accessJwt}`;

    if (action === "request") {
      const res = await fetch(
        `${pdsBaseUrl}/xrpc/com.atproto.server.requestEmailConfirmation`,
        { method: "POST", headers: { Authorization: auth } },
      );
      if (!res.ok) {
        const detail = (await res.text().catch(() => "")).slice(0, 300);
        return NextResponse.json(
          { message: "Failed to send confirmation code", detail },
          { status: 502 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    // action === "confirm"
    if (!token || !email) {
      return NextResponse.json(
        { message: "token and email are required to confirm" },
        { status: 400 },
      );
    }
    const res = await fetch(
      `${pdsBaseUrl}/xrpc/com.atproto.server.confirmEmail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify({ email, token }),
      },
    );
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      return NextResponse.json(
        { message: "Failed to confirm email", detail },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as { status?: number })?.status ?? 500;
    return NextResponse.json({ message }, { status });
  }
}
