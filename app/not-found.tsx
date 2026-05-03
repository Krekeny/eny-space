import { Heading } from "@/components/heading";
import { ButtonLink } from "@/components/button-link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-32 text-center">
      <Heading className="text-5xl tracking-tight text-white sm:text-6xl md:text-7xl">
        you've drifted past the heliopause.
      </Heading>
      <Heading as="h2" className="text-2xl text-white/50">
        404
      </Heading>
      <p className="text-muted-foreground max-w-sm">
        you've gone too far into the unknown. this page doesn't exist.
      </p>
      <ButtonLink
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Go home
      </ButtonLink>
    </div>
  );
}
