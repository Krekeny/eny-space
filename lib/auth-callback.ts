import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function exchangeCodeAndRedirect(
  request: Request,
  code: string | null,
  successPath: string,
  errorPath: string
): Promise<NextResponse> {
  if (!code) {
    return NextResponse.redirect(new URL(errorPath, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(errorPath, request.url));
  }

  return NextResponse.redirect(new URL(successPath, request.url));
}
