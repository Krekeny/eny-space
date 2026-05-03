import { Card, CardHeader, CardFooter } from "@/actions/components/ui/card";
import { Heading } from "@/components/heading";
import { Paragraph } from "@/components/paragraph";
import { SparklesIcon } from "lucide-react";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Switching to eny.space was the best decision for our DeFi platform. Uptime and performance are unmatched.",
    name: "Isagi Yoichi",
    role: "Chief Technology Officer",
    company: "3Portals",
  },
  {
    quote:
      "We can finally deploy smart contracts confidently without worrying about central servers failing.",
    name: "Oliver Aiku",
    role: "Digital Community Lead",
    company: "Acme Corp",
  },
  {
    quote:
      "The migration was seamless and our team now ships faster than ever, with full visibility into our data.",
    name: "Alex Rivera",
    role: "Head of Engineering",
    company: "Nebula Labs",
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="flex h-full min-w-[280px] max-w-sm flex-col justify-between rounded-3xl border-none bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 p-6 text-white/90 shadow-xl/30 whitespace-normal">
      <CardHeader className="px-0">
        <Paragraph className="text-sm text-white/80">
          {testimonial.quote}
        </Paragraph>
      </CardHeader>

      <CardFooter className="mt-4 items-center justify-between gap-4 border-t border-white/10 bg-transparent px-0 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wide text-white/90">
            {testimonial.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {testimonial.name}
            </span>
            <span className="text-xs text-white/60">{testimonial.role}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
          <span className="flex size-6 items-center justify-center rounded-full bg-fuchsia-400/15">
            <SparklesIcon className="size-3.5 text-fuchsia-300" aria-hidden />
          </span>
          <span>{testimonial.company}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

export function TestimonialsSection() {
  return (
    <section className="relative w-full px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <Heading
          as="h2"
          className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          Trusted by Innovators Worldwide.
        </Heading>
        <Paragraph className="mt-4 text-sm text-white/70 sm:text-base">
          Hear first-hand from our incredible community of customers.
        </Paragraph>
      </div>

      <div className="mx-auto mt-12 max-w-6xl">
        <div className="relative w-full overflow-hidden pt-4 pb-8 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee items-stretch gap-6 [transform:translateZ(0)]">
            {["a", "b"].map((blockId) => (
              <div
                key={blockId}
                className="flex shrink-0 items-stretch gap-6 whitespace-nowrap"
              >
                {TESTIMONIALS.map((testimonial) => (
                  <TestimonialCard
                    key={`${blockId}-${testimonial.name}`}
                    testimonial={testimonial}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
