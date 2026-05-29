import { exchangeCodeAndRedirect } from "@/lib/auth-callback";

/** Handles signup / email-confirmation PKCE codes from Supabase. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next =
    requestUrl.searchParams.get("next")?.startsWith("/") &&
    !requestUrl.searchParams.get("next")!.startsWith("//")
      ? requestUrl.searchParams.get("next")!
      : "/welcome";

  return exchangeCodeAndRedirect(
    request,
    requestUrl.searchParams.get("code"),
    next,
    "/signup?error=expired"
  );
}
