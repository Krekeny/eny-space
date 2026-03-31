import { NextResponse } from "next/server";

import {
  getPdsBaseUrlFromService,
  getPdsServiceForCurrentUser,
} from "../helpers";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      identifier: string;
      password: string;
    };

    if (!body?.identifier || !body?.password) {
      return NextResponse.json(
        { message: "Missing required fields: identifier, password" },
        { status: 400 },
      );
    }

    const { service, pdsServiceId } = await getPdsServiceForCurrentUser();

    const requiredServiceIdRaw = process.env.NEXT_PUBLIC_PDS_TEST_SERVICE_ID;
    if (requiredServiceIdRaw) {
      const requiredServiceId = Number(requiredServiceIdRaw);
      if (pdsServiceId !== requiredServiceId) {
        return NextResponse.json(
          {
            message: `PDS service id mismatch: expected ${requiredServiceId}, got ${pdsServiceId}`,
          },
          { status: 409 },
        );
      }
    }

    const pdsBaseUrl = getPdsBaseUrlFromService(service);

    const res = await fetch(
      `${pdsBaseUrl}/xrpc/com.atproto.server.createSession`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: body.identifier,
          password: body.password,
        }),
      },
    );

    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await res.json()
      : await res.text().catch(() => "");

    if (!res.ok) {
      return NextResponse.json(
        { message: "Failed to create session", status: res.status, payload },
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

