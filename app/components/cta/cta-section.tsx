import Image from "next/image";
import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { ArrowRightIcon } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative w-full bg-neutral-950 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center sm:gap-7">
        <div className="flex items-center gap-2 text-white/80">
          <Image
            src="/logo.svg"
            alt="eny.space"
            width={40}
            height={40}
            className="shrink-0"
          />
          <Paragraph className="text-xs font-semibold uppercase tracking-[0.2em]">
            eny.space
          </Paragraph>
        </div>
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Try eny.space for Free - No Strings Attached.
        </Heading>
        <Paragraph className="max-w-2xl text-sm text-white/70 sm:text-base">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Deploy
          your first app or website in just a few minutes.
        </Paragraph>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink
            href="/demo"
            className="border border-white/30 bg-transparent px-6 text-xs font-semibold uppercase tracking-wide text-white hover:border-white hover:bg-white/10"
            endIcon={<ArrowRightIcon className="size-4" aria-hidden />}
          >
            Placeholder
          </ButtonLink>
          <ButtonLink
            href="/signup"
            className="px-6 text-xs font-semibold uppercase tracking-wide text-neutral-950 shadow-[0_0_40px_rgba(190,242,100,0.45)] bg-lime-400 hover:bg-lime-300"
            endIcon={<ArrowRightIcon className="size-4" aria-hidden />}
          >
            Start free trial
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
