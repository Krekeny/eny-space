import { exchangeCodeAndRedirect } from "@/lib/auth-callback";

/** Handles password-recovery PKCE codes from Supabase reset emails. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  return exchangeCodeAndRedirect(
    request,
    requestUrl.searchParams.get("code"),
    "/reset-password",
    "/forgot-password?error=expired"
  );
}
