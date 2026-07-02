# eny.space

your data, your space, use it enywhere.

Managed [AT Protocol](https://atproto.com) PDS (Personal Data Server) hosting — a brand of krekeny GmbH. Built with Next.js, Supabase, and Stripe.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Supabase (Auth + PostgreSQL)
- Stripe (subscriptions + webhooks)
- Vercel (hosting + cron)

## Getting Started

Prerequisites: Node.js 18+, a Supabase project, a Stripe account + the [Stripe CLI](https://stripe.com/docs/stripe-cli).

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
```

Apply the migrations in `supabase/migrations/` to your Supabase project (SQL Editor, or `supabase db push` if CLI-linked), then start the app:

```bash
npm run dev
```

Stripe webhooks drive PDS provisioning, so for local development forward them to your app and put the printed signing secret in `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:3000/api/webhooks
```

The app runs at http://localhost:3000. Use the Stripe test card `4242 4242 4242 4242` (any future expiry / CVC).

## Deployment

Deploy to any Next.js host — Vercel is recommended, as `vercel.json` already defines the lifecycle cron. Set the environment variables from `.env.local.example`, add a production Stripe webhook pointing at `/api/webhooks`, and set `CRON_SECRET`.

## Project Structure

- `app/` — App Router: `dashboard/`, `subscribe/`, auth pages, `api/` route handlers, and shared `components/`
- `lib/` — Stripe/Supabase clients, plan catalog, PDS lifecycle & infra helpers
- `supabase/migrations/` — database migrations (apply in order)
- `scripts/` — local development helpers
- `scripts/og/` — Open Graph / social card generator (`pnpm og`); see [scripts/og/README.md](scripts/og/README.md)

## Mirroring

Tangled is the primary git host. All pushes to `main`, `develop`, and `feature/*` branches are automatically mirrored to GitHub under `mirror/<branch-name>` via the Tangled CI pipeline at `.tangled/workflows/mirror.yml`. No manual multi-remote setup is needed.

## How to Contribute

1. Clone: `git clone git@tangled.org:samsour.de/eny-space`
2. Branch: `git checkout -b feature/your-feature`
3. Work: edit → `git add . && git commit -m "your message"`
4. Push: `git push origin feature/your-feature`
