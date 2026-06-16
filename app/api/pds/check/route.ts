import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProfaneSlug } from "@/lib/profanity-server";

const PDS_API_BASE_URL = process.env.PDS_API_BASE_URL;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!PDS_API_BASE_URL) {
    return NextResponse.json({ error: "Missing PDS_API_BASE_URL" }, { status: 500 });
  }

  const apiToken = process.env.PDS_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ error: "Missing PDS_API_TOKEN" }, { status: 500 });
  }

  let hostname: string;
  try {
    const body = await req.json();
    hostname = body?.hostname;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!hostname || typeof hostname !== "string") {
    return NextResponse.json({ error: "hostname is required" }, { status: 400 });
  }

  // The user's own existing PDS counts as available to them (resubscribe flow),
  // so their current name isn't reported as "taken".
  const norm = (h: string) =>
    h.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
  const { data: ownRow } = await supabase
    .from("pds_services")
    .select("hostname")
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownRow?.hostname && norm(ownRow.hostname) === norm(hostname)) {
    return NextResponse.json({ exists: false });
  }

  // Reject profane / disallowed names before they reach the backend. Derive the
  // slug by stripping the hostname suffix (e.g. "name.eny.space" -> "name").
  const suffix = (
    process.env.NEXT_PUBLIC_PDS_HOSTNAME_SUFFIX ?? ".eny.space"
  ).toLowerCase();
  const host = norm(hostname);
  const slug = host.endsWith(suffix) ? host.slice(0, -suffix.length) : host;
  if (isProfaneSlug(slug)) {
    return NextResponse.json({ exists: false, blocked: true });
  }

  const res = await fetch(`${PDS_API_BASE_URL}/check-pds`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ hostname }),
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  return NextResponse.json(data, { status: res.status });
}
