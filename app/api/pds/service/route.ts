import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const PDS_API_BASE_URL = process.env.PDS_API_BASE_URL;

export async function GET() {
  try {
    if (!PDS_API_BASE_URL) {
      return NextResponse.json(
        { error: "Missing PDS_API_BASE_URL env variable" },
        { status: 500 }
      );
    }

    const apiToken = process.env.PDS_API_TOKEN;

    if (!apiToken) {
      return NextResponse.json(
        {
          error:
            "Missing PDS_API_TOKEN env variable for authenticating with PDS API",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data: pdsServiceRow } = await supabase
      .from("pds_services")
      .select("pds_service_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const pdsServiceId = pdsServiceRow?.pds_service_id as
      | number
      | null
      | undefined;

    if (!pdsServiceId) {
      return NextResponse.json(
        { message: "No provisioned PDS found for this user yet" },
        { status: 404 }
      );
    }

    const pdsServiceUrl = `${PDS_API_BASE_URL}/service/${pdsServiceId}`;

    const res = await fetch(pdsServiceUrl, {
      // Ensure this runs server-side only and is not cached aggressively
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Authorization: `Bearer ${apiToken}`,
      },
    });

    const contentType = res.headers.get("content-type") || "";

    // Try to parse JSON if it looks like JSON, otherwise fall back to text
    if (contentType.includes("application/json")) {
      let data: unknown = await res.json();

      // Some backends double-encode JSON as a string; handle that gracefully.
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          // keep as string if it isn't valid JSON
        }
      }

      if (!res.ok) {
        return NextResponse.json(
          {
            error: "Upstream request failed",
            status: res.status,
            body: data,
          },
          { status: 502 }
        );
      }

      const d = (data ?? {}) as Record<string, any>;
      return NextResponse.json({
        state: d.state ?? null,
        hostname: d.hostname || d.encrypted_config?.hostname || null,
      });
    }

    const bodyText = await res.text();

    // Return diagnostics so we can see what the upstream is sending
    return NextResponse.json(
      {
        error: "Upstream did not return JSON",
        status: res.status,
        contentType,
        bodyPreview: bodyText.slice(0, 500),
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Error proxying PDS service request", error);
    return NextResponse.json(
      {
        error: "Failed to reach PDS service endpoint",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
