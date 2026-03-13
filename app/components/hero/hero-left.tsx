import { ButtonLink } from "@/components/button-link";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { ArrowUpRightIcon } from "lucide-react";

export function HeroLeft() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Heading
        as="h1"
        className="font-heading text-4xl leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
      >
        Managed PDS hosting with a real UI.
      </Heading>
      <Paragraph className="text-lg text-white/90 sm:text-xl">
        eny.space lets you run your own Personal Data Server without touching
        Kubernetes, Docker or cloud consoles. Spin up a PDS in one click, bring
        your own domain, and manage users, access and resources from a clear, AT
        Protocol-native dashboard.
      </Paragraph>
      <div className="flex flex-wrap gap-3">
        <ButtonLink
          href="/signup"
          className="border border-white/80 bg-transparent uppercase tracking-wide text-white hover:bg-white/10 hover:border-white focus-visible:ring-white/50"
          endIcon={<ArrowUpRightIcon className="size-4" aria-hidden />}
        >
          Launch your PDS
        </ButtonLink>
        <ButtonLink
          href="/dashboard"
          className="border border-white/80 bg-transparent uppercase tracking-wide text-white hover:bg-white/10 hover:border-white focus-visible:ring-white/50"
          endIcon={<ArrowUpRightIcon className="size-4" aria-hidden />}
        >
          View PDS dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
