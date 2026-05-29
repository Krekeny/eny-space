import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
