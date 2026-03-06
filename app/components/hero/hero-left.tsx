import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { ArrowUpRightIcon } from "lucide-react";

export function HeroLeft() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Heading
        as="h1"
        className="text-4xl leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
      >
        Lorem ipsum dolor sit amet
      </Heading>
      <Paragraph className="text-lg text-white/90 sm:text-xl">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam.
      </Paragraph>
      <div className="flex flex-wrap gap-3">
        <ButtonLink
          href="/signup"
          className="border border-white/80 bg-transparent uppercase tracking-wide text-white hover:bg-white/10 hover:border-white focus-visible:ring-white/50"
          endIcon={<ArrowUpRightIcon className="size-4" aria-hidden />}
        >
          Button 1
        </ButtonLink>
        <ButtonLink
          href="/dashboard"
          className="border border-white/80 bg-transparent uppercase tracking-wide text-white hover:bg-white/10 hover:border-white focus-visible:ring-white/50"
          endIcon={<ArrowUpRightIcon className="size-4" aria-hidden />}
        >
          Button 2
        </ButtonLink>
      </div>
    </div>
  );
}
