import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { isRecoverySession } from "@/lib/auth";

const AUTH_ROUTES = ["/login", "/signup"];
const RESET_PASSWORD_PATH = "/reset-password";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const pathname = request.nextUrl.pathname;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session && isRecoverySession(session.access_token)) {
      if (pathname !== RESET_PASSWORD_PATH) {
        return NextResponse.redirect(new URL(RESET_PASSWORD_PATH, request.url));
      }
      return response;
    }

    if (AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
