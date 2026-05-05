import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import {
  getPdsBaseUrlFromService,
  getPdsServiceForCurrentUser,
} from "../helpers";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      handle: string;
      password: string;
      inviteCode: string;
    };

    if (!body?.handle || !body?.password || !body?.inviteCode) {
      return NextResponse.json(
        { message: "Missing required fields: handle, password, inviteCode" },
        { status: 400 }
      );
    }

    const { service, pdsServiceId } = await getPdsServiceForCurrentUser();

    const requiredServiceIdRaw = process.env.PDS_TEST_SERVICE_ID;
    if (requiredServiceIdRaw) {
      const requiredServiceId = Number(requiredServiceIdRaw);
      if (pdsServiceId !== requiredServiceId) {
        return NextResponse.json(
          {
            message: `PDS service id mismatch: expected ${requiredServiceId}, got ${pdsServiceId}`,
          },
          { status: 409 }
        );
      }
    }

    // Ensure we always have `https://...` for fetch
    const pdsBaseUrl = getPdsBaseUrlFromService(service);

    let emailToUse = body.email;
    if (!emailToUse) {
      // Reuse the user's own Supabase email for testing, but add a +alias suffix
      // to avoid collisions if the backend enforces uniqueness.
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        return NextResponse.json(
          {
            message:
              "Missing email (neither request body nor Supabase user email found)",
          },
          { status: 400 }
        );
      }

      const baseEmail = user.email;
      const [local, domain] = baseEmail.split("@");
      const alias = `${local}+atproto-test-${Date.now()}`;
      emailToUse = `${alias}@${domain}`;
    }

    const res = await fetch(
      `${pdsBaseUrl}/xrpc/com.atproto.server.createAccount`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToUse,
          handle: body.handle,
          password: body.password,
          inviteCode: body.inviteCode,
        }),
      }
    );

    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await res.json()
      : await res.text().catch(() => "");

    if (!res.ok) {
      return NextResponse.json(
        { message: "Failed to create account", status: res.status, payload },
        { status: 502 }
      );
    }

    // Return the email that we used, so the UI mirrors the real admin workflow.
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
