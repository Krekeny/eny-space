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
    title: "One-click managed PDS",
    description:
      "Spin up a Personal Data Server from a simple UI, no infrastructure to wire up.",
    icon: <NetworkIcon className="size-5" aria-hidden />,
  },
  {
    title: "Easy administration",
    description:
      "Invite users and run what you'd normally script on the command line, all from a web dashboard.",
    icon: <CloudIcon className="size-5" aria-hidden />,
  },
  {
    title: "Live resource insights",
    description:
      "See active users and storage usage at a glance. Performance is on us, so it's never something you have to watch.",
    icon: <ScaleIcon className="size-5" aria-hidden />,
    upcoming: true,
  },
  {
    title: "AT Protocol-native access",
    description:
      "Built for AT Protocol users, email and handle, no extra login. Your PDS becomes your social cloud space.",
    icon: <ShieldCheckIcon className="size-5" aria-hidden />,
  },
  {
    title: "PDS explorer UI",
    description:
      "Browse your PDS like a file explorer: posts, images and collections. Your data as a real, visual space.",
    icon: <ZapIcon className="size-5" aria-hidden />,
    upcoming: true,
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
          Managed PDS hosting for AT Protocol power users
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
            upcoming={feature.upcoming}
            className="basis-[min(100%,320px)]"
          />
        ))}
      </div>
    </section>
  );
}
