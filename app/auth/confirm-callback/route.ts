import { exchangeCodeAndRedirect } from "@/lib/auth-callback";

/** Handles signup / email-confirmation PKCE codes from Supabase. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  return exchangeCodeAndRedirect(
    request,
    requestUrl.searchParams.get("code"),
    "/dashboard",
    "/signup?error=expired"
  );
}
