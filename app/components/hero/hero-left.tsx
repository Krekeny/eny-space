import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { ArrowUpRightIcon } from "lucide-react";

export function HeroLeft() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Heading
        as="h1"
        className="font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
      >
        Managed PDS hosting, made for you.
      </Heading>
      <Paragraph className="text-lg text-white/90 sm:text-xl">
        We run your Personal Data Server, no infrastructure to manage. Concentrate on building things on the AT
        Protocol, or just have your own personal social cloud space.
      </Paragraph>
      <div className="flex flex-wrap gap-3">
        <ButtonLink
          href="/signup"
          className="border border-white/80 bg-transparent uppercase tracking-wide text-white hover:bg-white/10 hover:border-white focus-visible:ring-white/50"
          endIcon={<ArrowUpRightIcon className="size-4" aria-hidden />}
        >
          Get started
        </ButtonLink>
      </div>
    </div>
  );
}
