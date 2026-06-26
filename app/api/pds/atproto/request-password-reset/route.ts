import { NextResponse } from "next/server";

import {
  getPdsBaseUrlFromService,
  getPdsServiceForCurrentUser,
} from "../helpers";

// Trigger the PDS to email a password-reset token to an account on the caller's
// own PDS. com.atproto.server.requestPasswordReset is unauthenticated, but we
// resolve the PDS from the caller's session so resets can only be sent for
// accounts on their own server.
export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) {
      return NextResponse.json(
        { message: "email is required" },
        { status: 400 },
      );
    }

    const { service } = await getPdsServiceForCurrentUser();
    const pdsBaseUrl = getPdsBaseUrlFromService(service);

    const res = await fetch(
      `${pdsBaseUrl}/xrpc/com.atproto.server.requestPasswordReset`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );

    const bodyText = await res.text();
    let payload: unknown = bodyText;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      // keep as text
    }

    if (!res.ok) {
      console.error(
        `[pds-password-reset] upstream ${res.status} ${res.statusText} for email=${email} pds=${pdsBaseUrl}: ${bodyText.slice(0, 800)}`,
      );
      return NextResponse.json(
        { message: "Failed to send password reset", status: res.status, payload },
        { status: 502 },
      );
    }

    console.log(`[pds-password-reset] sent ${res.status} for email=${email}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as { status?: number })?.status ?? 500;
    console.error("[pds-password-reset] failed:", message);
    return NextResponse.json({ message }, { status });
  }
}
