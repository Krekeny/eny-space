import { NextResponse } from "next/server";

import {
  getPdsBaseUrlFromService,
  getPdsServiceForCurrentUser,
} from "../helpers";

function toBasicAuth(user: string, pass: string) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export async function GET() {
  try {
    const { service } = await getPdsServiceForCurrentUser();

    const adminPassword = service?.encrypted_config?.adminPassword as
      | string
      | undefined;
    if (!adminPassword) {
      return NextResponse.json(
        { message: "Missing PDS admin credentials" },
        { status: 500 }
      );
    }

    const pdsBaseUrl = getPdsBaseUrlFromService(service);
    const authHeader = toBasicAuth("admin", String(adminPassword).trim());

    // Step 1: list all repos (public endpoint, gives us DIDs)
    const listUrl = new URL(`${pdsBaseUrl}/xrpc/com.atproto.sync.listRepos`);
    listUrl.searchParams.set("limit", "100");

    const listRes = await fetch(listUrl.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!listRes.ok) {
      const body = await listRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: "Failed to list repos",
          status: listRes.status,
          upstream: body,
        },
        { status: 502 }
      );
    }

    const { repos = [] } = await listRes.json();
    const dids: string[] = repos.map((r: { did: string }) => r.did);

    if (dids.length === 0) {
      return NextResponse.json({ accounts: [] });
    }

    // Step 2: get account details for all DIDs (admin Basic auth accepted here)
    const infoUrl = new URL(
      `${pdsBaseUrl}/xrpc/com.atproto.admin.getAccountInfos`
    );
    dids.forEach((did) => infoUrl.searchParams.append("dids", did));

    const infoRes = await fetch(infoUrl.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authHeader,
      },
    });

    if (!infoRes.ok) {
      const body = await infoRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: "Failed to fetch account details",
          status: infoRes.status,
          upstream: body,
        },
        { status: 502 }
      );
    }

    const { infos = [] } = await infoRes.json();
    return NextResponse.json({ accounts: infos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { did } = (await req.json()) as { did?: string };
    if (!did) {
      return NextResponse.json(
        { message: "Missing required field: did" },
        { status: 400 }
      );
    }

    const { service } = await getPdsServiceForCurrentUser();
    const adminPassword = service?.encrypted_config?.adminPassword as
      | string
      | undefined;
    if (!adminPassword) {
      return NextResponse.json(
        { message: "Missing PDS admin credentials" },
        { status: 500 }
      );
    }

    const pdsBaseUrl = getPdsBaseUrlFromService(service);
    const authHeader = toBasicAuth("admin", String(adminPassword).trim());

    const res = await fetch(
      `${pdsBaseUrl}/xrpc/com.atproto.admin.deleteAccount`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ did }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: "Failed to delete account",
          status: res.status,
          upstream: body,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = (error as any)?.status ?? 500;
    return NextResponse.json({ message }, { status });
  }
}

