import Image from "next/image";

export function HeroBackground() {
  return (
    <div
      className="absolute inset-0 -z-10 bg-neutral-950"
      aria-hidden
    >
      {/* Gradient from dark top to warm orange-yellow bottom */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 45%, oklch(0.75 0.12 75 / 0.4) 85%, oklch(0.8 0.14 85 / 0.6) 100%)",
        }}
      />
      {/* Subtle grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Large decorative logo - subtle, upper center */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 opacity-20">
        <Image
          src="/logo.svg"
          alt=""
          width={480}
          height={480}
          className="shrink-0"
        />
      </div>
    </div>
  );
}
