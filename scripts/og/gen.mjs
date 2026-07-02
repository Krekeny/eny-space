#!/usr/bin/env node
/**
 * OG image generator for eny.space.
 *
 * Build a card on the go:
 *   pnpm og --variant brand --out public/og.png
 *   pnpm og --variant post \
 *     --kicker "eny.space · blog" \
 *     --title "Putting a UI on PDS account management" \
 *     --subtitle "Getting AT Protocol account management out of the terminal." \
 *     --out public/og-blog.png
 *
 * Fonts: Doto (branding/headlines) + Fira Mono (copy), rendered via resvg.
 * Edit THEME / LAYOUT below to restyle every card at once.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const FONTS = path.join(HERE, "fonts");

// ---- theme (edit me) -------------------------------------------------------
const THEME = {
  w: 1200,
  h: 630,
  bgFrom: "#080a16",
  bgTo: "#150f2e",
  glow: "#7c3aed",
  accent: "#a78bfa",
  title: "#ffffff",
  copyBright: "#cbd5e1",
  copy: "#94a3b8",
  muted: "#64748b",
  planet: "public/pixel-planet-static.png",
  headFont: "Doto", // branding + headlines
  copyFont: "Fira Mono", // everything else
};

// ---- helpers ---------------------------------------------------------------
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    o[key] = next && !next.startsWith("--") ? argv[++i] : true;
  }
  return o;
}

// seeded RNG so a given seed always yields the same starfield
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function starfield(seed, count = 80) {
  const rand = rng(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = Math.round(rand() * THEME.w);
    const y = Math.round(rand() * THEME.h);
    const s = rand() < 0.15 ? 3 : rand() < 0.5 ? 2 : 1;
    const o = (0.15 + rand() * 0.6).toFixed(2);
    const fill = rand() < 0.18 ? THEME.accent : "#e4e4e7";
    out += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fill}" opacity="${o}"/>`;
  }
  return out;
}

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxChars) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function textLines(lines, { x, y, size, font, fill, lh, weight }) {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${y + i * lh}" font-family="${font}" font-size="${size}"${
          weight ? ` font-weight="${weight}"` : ""
        } fill="${fill}">${esc(line)}</text>`,
    )
    .join("");
}

// ---- layouts ---------------------------------------------------------------
function brandCard(a) {
  const title = a.title || "eny.space";
  const subtitle = a.subtitle || "one-click PDS hosting for the atmosphere";
  const footer = a.footer || "AT Protocol · Personal Data Servers";

  // Wrap the tagline to <=2 rows so it never runs into the planet.
  const subLines = wrap(subtitle, 22).slice(0, 2);

  return `
    <image href="data:image/png;base64,${a.planet}" x="800" y="150" width="360" height="360"/>
    <text x="80" y="315" font-family="${THEME.headFont}" font-weight="800" font-size="120" fill="${THEME.title}">${esc(title)}</text>
    ${textLines(subLines, { x: 82, y: 398, size: 32, font: THEME.copyFont, fill: THEME.copyBright, lh: 44 })}
    <text x="82" y="548" font-family="${THEME.copyFont}" font-size="22" fill="${THEME.muted}">${esc(footer)}</text>`;
}

function postCard(a) {
  const kicker = a.kicker || "eny.space · blog";
  const titleLines = wrap(a.title || "Untitled", 16).slice(0, 3);
  const subLines = wrap(a.subtitle || "", 40).slice(0, 2);
  const footer = a.footer || "eny.space";

  const titleTop = 262;
  const titleLh = 76;
  const subTop = titleTop + titleLines.length * titleLh + 24;

  return `
    <image href="data:image/png;base64,${a.planet}" x="900" y="40" width="300" height="300"/>
    <text x="80" y="140" font-family="${THEME.copyFont}" font-size="26" fill="${THEME.accent}" letter-spacing="2">${esc(kicker)}</text>
    ${textLines(titleLines, { x: 80, y: titleTop, size: 62, font: THEME.headFont, fill: THEME.title, lh: titleLh, weight: 800 })}
    ${textLines(subLines, { x: 80, y: subTop, size: 27, font: THEME.copyFont, fill: THEME.copy, lh: 36 })}
    <text x="80" y="600" font-family="${THEME.copyFont}" font-size="22" fill="${THEME.muted}">${esc(footer)}</text>`;
}

// ---- main ------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
const variant = args.variant || "post";
const out = args.out || "public/og.png";
const seed = Number(args.seed ?? (variant === "brand" ? 7 : 42));

const planet = fs
  .readFileSync(path.join(ROOT, THEME.planet))
  .toString("base64");
const body = { ...args, planet };
const inner = variant === "brand" ? brandCard(body) : postCard(body);

const svg = `<svg width="${THEME.w}" height="${THEME.h}" viewBox="0 0 ${THEME.w} ${THEME.h}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${THEME.bgFrom}"/><stop offset="1" stop-color="${THEME.bgTo}"/></linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.35" r="0.55"><stop offset="0" stop-color="${THEME.glow}" stop-opacity="0.4"/><stop offset="1" stop-color="${THEME.glow}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${THEME.w}" height="${THEME.h}" fill="url(#bg)"/>
  <g>${starfield(seed)}</g>
  <rect width="${THEME.w}" height="${THEME.h}" fill="url(#glow)"/>
  <rect x="0" y="0" width="${THEME.w}" height="6" fill="${THEME.glow}"/>
  ${inner}
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: THEME.w },
  font: {
    loadSystemFonts: false,
    defaultFontFamily: THEME.copyFont,
    fontFiles: [
      path.join(FONTS, "Doto.ttf"),
      path.join(FONTS, "FiraMono-Regular.ttf"),
      path.join(FONTS, "FiraMono-Medium.ttf"),
      path.join(FONTS, "FiraMono-Bold.ttf"),
    ],
  },
});

const outAbs = path.isAbsolute(out) ? out : path.join(ROOT, out);
fs.mkdirSync(path.dirname(outAbs), { recursive: true });
fs.writeFileSync(outAbs, resvg.render().asPng());
console.log(`wrote ${out} (${variant})`);
