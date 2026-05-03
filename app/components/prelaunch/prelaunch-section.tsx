import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { prelaunch } from "@/lib/prelaunch";
import { ButtonLink } from "@/components/button-link";
import { ArrowRightIcon } from "lucide-react";

export async function PrelaunchSection() {
  if (!prelaunch) return null;

  return (
    <section
      id="prelaunch"
      className="relative w-full px-4 py-20 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-5xl text-center">
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Can't wait for the launch?
        </Heading>
        <Paragraph className="mt-4 text-sm text-white/70 sm:text-base">
          Sign up for early access and we will update you the moment our service
          is available to the public.
        </Paragraph>

        <ButtonLink
          href="/signup"
          className="mt-6 px-6 uppercase tracking-wide text-neutral-950 shadow-[0_0_40px_rgba(232,121,249,0.45)] bg-fuchsia-400 hover:bg-fuchsia-300"
          endIcon={<ArrowRightIcon className="size-4" aria-hidden />}
        >
          Sign up
        </ButtonLink>
      </div>
    </section>
  );
}
