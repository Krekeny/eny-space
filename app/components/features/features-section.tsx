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
    title: "Example Feature One.",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus efficitur urna a augue pulvinar, vitae facilisis massa dictum.",
    icon: <NetworkIcon className="size-5" aria-hidden />,
  },
  {
    title: "Sample Multi-Network.",
    description:
      "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Suspendisse potenti.",
    icon: <CloudIcon className="size-5" aria-hidden />,
  },
  {
    title: "Lorem Scalability.",
    description:
      "Suspendisse vitae dictum lectus. Ut bibendum, leo eu tempor ullamcorper, eros ex euismod nunc, nec cursus nisi ex non purus.",
    icon: <ScaleIcon className="size-5" aria-hidden />,
  },
  {
    title: "Secure Example.",
    description:
      "Etiam egestas, erat sit amet dictum cursus, sapien quam gravida ex, nec imperdiet libero sem at sapien faucibus consequat.",
    icon: <ShieldCheckIcon className="size-5" aria-hidden />,
  },
  // {
  //   title: "Instant Launchpad.",
  //   description:
  //     "Quisque congue elit eu velit maximus auctor. Nullam ac mauris quam. Nullam eget erat convallis, consequat purus non, cursus enim.",
  //   icon: <RocketIcon className="size-5" aria-hidden />,
  // },
  {
    title: "Performance Demo.",
    description:
      "Praesent iaculis urna non eros pretium, in posuere lectus cursus. Sed facilisis facilisis ex, ac molestie tellus posuere vitae.",
    icon: <ZapIcon className="size-5" aria-hidden />,
  },
];

export function FeaturesSection() {
  return (
    <section className="relative w-full bg-neutral-950 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Lorem Ipsum Dolor Sit Amet - Fast, Reliable, Easy.
        </Heading>
        <Paragraph className="mt-4 text-sm text-white/70 sm:text-base">
          Pellentesque habitant morbi tristique senectus et netus et malesuada
          fames ac turpis egestas. Proin facilisis nec erat eu molestie.
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
