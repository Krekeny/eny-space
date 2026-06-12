import {
  CloudIcon,
  NetworkIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ZapIcon,
  RocketIcon,
} from "lucide-react";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { FeatureCard } from "./feature-card";

const FEATURES = [
  {
    title: "One‑click managed PDS.",
    description:
      "Create a Personal Data Server directly from the eny.space UI—no Kubernetes clusters, Docker images or cloud consoles to wire up. Choose your settings, attach a domain and go live in minutes.",
    icon: <NetworkIcon className="size-5" aria-hidden />,
  },
  {
    title: "Dashboard‑first administration.",
    description:
      "Invite users to your PDS, manage access and roles, and handle tasks you would normally script on the command line from a clear web dashboard.",
    icon: <CloudIcon className="size-5" aria-hidden />,
  },
  {
    title: "Live resource insights.",
    description:
      "See active users and exactly how much of your storage your PDS is using, as clear live figures—so you always know where you stand, without digging through logs. Performance is on us, so it's never something you have to watch.",
    icon: <ScaleIcon className="size-5" aria-hidden />,
  },
  {
    title: "AT Protocol‑native access.",
    description:
      "Built for AT Protocol and Bluesky power users who arrive with an email and handle, not yet another social login. Your PDS becomes your social cloud space.",
    icon: <ShieldCheckIcon className="size-5" aria-hidden />,
  },
  {
    title: "PDS explorer UI.",
    description:
      "Browse everything on your PDS like a file explorer—posts, images, PDFs and collections. See what’s stored, which apps use it and treat your PDS as a real, visual space.",
    icon: <ZapIcon className="size-5" aria-hidden />,
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative w-full px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-5xl text-center">
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Managed PDS hosting for AT Protocol power users.
        </Heading>
        <Paragraph className="mt-4 text-sm text-white/70 sm:text-base">
          Create, monitor and manage your Personal Data Server from a single
          dashboard. eny.space automates the infrastructure so you can focus on
          your data, apps and community.
        </Paragraph>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-wrap justify-center gap-6 sm:mt-12">
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            className="basis-[min(100%,320px)]"
          />
        ))}
      </div>
    </section>
  );
}
