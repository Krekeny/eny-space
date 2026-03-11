/* eslint-disable tailwindcss/no-custom-classname */
"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroBackground() {
  const { scrollYProgress } = useScroll();

  // Parallax ratios (approximate 10%, 30%, 80%)
  const deepStarsY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const midOrbsY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const planetY = useTransform(
    scrollYProgress,
    [0, 0.6, 1],
    ["0%", "-48%", "-64%"],
  );

  // "Camera angle" milestone – planet grows and shifts between 0.4–0.6
  const planetScale = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    [1, 1, 2, 2.4],
  );
  const planetX = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    ["0%", "0%", "-10%", "-14%"],
  );
  const planetRotate = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["-16deg", "0deg", "16deg"],
  );

  return (
    <>
      {/* Base fixed gradient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-slate-950"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(circle at 20% -10%, oklch(0.78 0.15 260 / 0.45) 0, transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* LAYER 1 – Deep tiny stars */}
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ y: deepStarsY }}
        aria-hidden
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="starGradient" r="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.9" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>

          {Array.from({ length: 90 }).map((_, i) => {
            const radius = Math.random() * 1.3 + 0.4;
            const blur = i % 7 === 0 ? 1.5 : 0;
            return (
              <circle
                key={i}
                cx={Math.random() * 1440}
                cy={Math.random() * 900}
                r={radius}
                fill="url(#starGradient)"
                opacity={0.5 + Math.random() * 0.4}
                style={{
                  filter: blur ? `blur(${blur}px)` : undefined,
                }}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* LAYER 2 – Mid orbs / energy fields */}
      <motion.div
        className="pointer-events-none fixed inset-0 -z-5"
        style={{ y: midOrbsY }}
        aria-hidden
      >
        <div className="absolute inset-0">
          <div className="absolute left-[12%] top-[18%] h-40 w-40 rounded-full bg-sky-400/10 blur-3xl shadow-[0_0_120px_rgba(56,189,248,0.55)]" />
          <div className="absolute right-[10%] top-[35%] h-56 w-56 rounded-full bg-fuchsia-400/15 blur-3xl shadow-[0_0_160px_rgba(244,114,182,0.65)]" />
          <div className="absolute left-[30%] bottom-[20%] h-48 w-64 rounded-[999px] bg-indigo-400/10 blur-[80px] shadow-[0_0_180px_rgba(129,140,248,0.6)]" />
          <div className="absolute right-[26%] bottom-[8%] h-32 w-32 rounded-full bg-amber-300/15 blur-3xl shadow-[0_0_130px_rgba(252,211,77,0.7)]" />

          {/* Soft vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
        </div>
      </motion.div>

      {/* LAYER 3 – Foreground planet (Jupiter image) */}
      <motion.div
        className="pointer-events-none fixed inset-0 -z-[1]"
        style={{
          y: planetY,
          scale: planetScale,
          x: planetX,
          rotate: planetRotate,
        }}
        aria-hidden
      >
        <div className="absolute bottom-[-22%] right-[2%] h-[360px] w-[360px] overflow-hidden rounded-full">
          <Image
            src="/jupiter2.png"
            alt="Gas giant planet"
            fill
            priority
            className="object-cover object-center"
          />
        </div>
      </motion.div>

      {/* LAYER 3b – Secondary planet (Earth image) */}
      <motion.div
        className="pointer-events-none fixed inset-0 -z-[1]"
        style={{
          y: planetY,
          scale: planetScale,
          x: planetX,
          rotate: planetRotate,
        }}
        aria-hidden
      >
        <div className="absolute bottom-[10%] left-[6%] h-[220px] w-[220px] overflow-hidden rounded-full">
          <Image
            src="/earth.png"
            alt="Blue planet"
            fill
            priority={false}
            className="object-cover object-center"
          />
        </div>
      </motion.div>
    </>
  );
}
