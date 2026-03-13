import { cn } from "@/actions/lib/utils";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-2xl bg-neutral-900/80 px-5 py-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] ring-1 ring-white/5",
        className,
      )}
    >
      <div className="mb-1 inline-flex size-10 items-center justify-center rounded-xl bg-fuchsia-400/15 text-fuchsia-300 shadow-[0_0_30px_rgba(232,121,249,0.6)]">
        {icon}
      </div>
      <Heading
        as="h3"
        className="text-base font-semibold text-white text-center"
      >
        {title}
      </Heading>
      <Paragraph className="text-sm leading-relaxed text-white/70 text-center">
        {description}
      </Paragraph>
    </div>
  );
}
