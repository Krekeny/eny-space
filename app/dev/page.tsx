import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { ButtonLink } from "@/components/button-link";
import { DebugClient } from "./debug-client";

// Dev-only: surfaces raw responses from our backend / infrastructure provider.
// Returns 404 on the production server.
export default async function DevDebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <ButtonLink
          href="/dashboard"
          className="text-sm text-white/50 hover:text-white"
        >
          ← Dashboard
        </ButtonLink>
        <Heading as="h1" className="text-lg font-semibold text-white">
          Backend Debug
        </Heading>
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300">
          dev only
        </span>
      </div>
      <Paragraph className="text-sm text-white/60">
        Raw responses from our backend / infrastructure provider, for the
        currently authenticated user. Also logged to the browser console. This
        page is only reachable on the development server.
      </Paragraph>

      <DebugClient />
    </main>
  );
}
