import { NextResponse } from "next/server";

import { createHash } from "crypto";

import { getPdsBaseUrlFromService, getPdsServiceForCurrentUser } from "../helpers";

function toBasicAuth(user: string, pass: string) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export async function POST(req: Request) {
  try {
    const { useCount } = (await req.json()) as { useCount?: number };

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

    const adminPassword = service?.encrypted_config?.adminPassword as
      | string
      | undefined;

    if (!service?.encrypted_config || !adminPassword) {
      return NextResponse.json(
        { message: "Missing PDS host/admin credentials" },
        { status: 500 },
      );
    }

    const trimmedAdminPassword = String(adminPassword).trim();
    const adminPasswordHashPrefix = createHash("sha256")
      .update(trimmedAdminPassword)
      .digest("hex")
      .slice(0, 10);

    // PDS scripts use `admin:${PDS_ADMIN_PASSWORD}`
    const authHeader = toBasicAuth("admin", trimmedAdminPassword);

    const pdsBaseUrl = getPdsBaseUrlFromService(service);

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

