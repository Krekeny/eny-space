# OG image generator

Generates Open Graph / social-share cards for eny.space using the site fonts
(**Doto** for branding/headlines, **Fira Mono** for copy) and the pixel-planet
mark. Rendered to PNG with [`@resvg/resvg-js`](https://github.com/yisibl/resvg-js)
(a `devDependency` — `pnpm install` is all you need; the fonts are committed in
[`fonts/`](./fonts), so nothing is downloaded at build time).

## Usage

```bash
# site-wide card (the default OG image for every page)
pnpm og --variant brand --out public/og.png

# a post/page-specific card
pnpm og --variant post \
  --kicker "eny.space · blog" \
  --title "Any headline — it auto-wraps" \
  --subtitle "One or two lines of copy." \
  --out public/og-my-post.png
```

Each run writes a **1200×630 PNG** to `--out`. Commit the image(s) you want to
serve into `public/`.

## Flags

| flag | variant | notes |
|---|---|---|
| `--variant` | — | `brand` (large `eny.space` wordmark) or `post` (kicker + wrapped title). Default `post`. |
| `--title` | both | Doto headline. In `post` it auto-wraps to ≤3 lines. |
| `--subtitle` | both | Fira Mono copy. Wraps to ≤2 rows (brand) / ≤2 lines (post). |
| `--kicker` | post | small violet label above the title. |
| `--footer` | both | bottom line. |
| `--seed` | both | integer; changes the starfield scatter (reproducible per seed). |
| `--out` | both | output path (relative to repo root or absolute). |

## How the images are used

- **`public/og.png`** is the **site-wide** OG image. It's referenced in
  [`app/layout.tsx`](../../app/layout.tsx) via `metadata.openGraph` / `metadata.twitter`,
  so every route falls back to it. `metadataBase` there turns the relative path
  into the absolute URL that scrapers require.
- **Per-page cards:** generate one with `--variant post`, commit it to `public/`,
  and point that route's `generateMetadata` `openGraph.images` at it. (The blog
  currently ships a card at `public/og-blog.png` but intentionally still uses the
  generic `og.png`.)

> OG cards only render in link previews once served from the production domain, so
> a change is visible after it deploys to `eny.space`.

## Customizing the look

Everything lives in [`gen.mjs`](./gen.mjs):

- **`THEME`** (top of the file) — colors, gradient, glow, fonts, planet asset,
  canvas size. Edit here to restyle every card at once.
- **`brandCard` / `postCard`** — per-variant layout (positions, font sizes, wrap
  widths). Add a new `function xCard()` + branch in `main` to introduce a variant.
- **Fonts** — swap the files in `fonts/` and update the `fontFiles` / family names
  in `gen.mjs`.
