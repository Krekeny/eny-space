import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { ArrowRightIcon } from "lucide-react";
import { prelaunch } from "@/lib/prelaunch";

export function CTASection() {
  return (
    <section className="relative w-full px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center sm:gap-7">
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Explore your PDS like a real space, not just an API.
        </Heading>
        <Paragraph className="max-w-2xl text-sm text-white/70 sm:text-base">
          Spin up a managed PDS in a few clicks and explore it through a clean,
          browser-based UI. See your posts, files and collections instead of raw
          JSON—then upgrade to dedicated hosting when you're ready.
        </Paragraph>

        {!prelaunch && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink
              href="/demo"
              className="border border-white/30 bg-transparent px-6 text-xs font-semibold uppercase tracking-wide text-white hover:border-white hover:bg-white/10"
              endIcon={<ArrowRightIcon className="size-4" aria-hidden />}
            >
              Open PDS UI demo
            </ButtonLink>
            <ButtonLink
              href="/signup"
              className="px-6 text-xs font-semibold uppercase tracking-wide text-neutral-950 shadow-[0_0_40px_rgba(232,121,249,0.45)] bg-fuchsia-400 hover:bg-fuchsia-300"
              endIcon={<ArrowRightIcon className="size-4" aria-hidden />}
            >
              Start free trial
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}
