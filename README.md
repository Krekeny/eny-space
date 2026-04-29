# eny.space

your data, your space, use it enywhere.

A full-stack TypeScript application using Next.js with Supabase Auth and Stripe subscriptions for access-controlled hosting services.

## Features

- **Authentication** - Email-based authentication with Supabase Auth
- **Subscriptions** - Stripe subscription checkout and management
- **Dashboard** - User dashboard showing subscription status
- **Protected API** - Server endpoints only accessible to subscribed users
- **Webhook handling** - Server-side webhook processing for subscription events

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Next.js Server Actions and Route Handlers
- **Auth**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payments**: Stripe Subscriptions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Stripe account

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up Supabase:

- Create a new Supabase project at [supabase.com](https://supabase.com)
- Run the migration file to create the subscriptions table:
  - Go to your Supabase project dashboard
  - Navigate to SQL Editor
  - Copy and run the contents of `supabase/migrations/001_subscriptions.sql`

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PRICE_ID=your_stripe_price_id

# Optional (recommended): plan-specific Price IDs for checkout + pricing display.
# If set, the UI will show the real Stripe amounts for each plan.
NEXT_PUBLIC_STRIPE_PRICE_PERSONAL_ID=your_stripe_price_id_personal
NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY_ID=your_stripe_price_id_community
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ID=your_stripe_price_id_business

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your Supabase keys from your project settings → API.
Get your Stripe keys from your Stripe dashboard.
Create 3 subscription prices in Stripe (Personal / Community / Business). Set the resulting Price IDs in `NEXT_PUBLIC_STRIPE_PRICE_PERSONAL_ID`, `NEXT_PUBLIC_STRIPE_PRICE_COMMUNITY_ID`, and `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ID`.

3. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Webhook Setup

#### Local Development

1. Install the Stripe CLI and link your account:

```bash
stripe login
```

2. Start webhook forwarding to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks
```

3. Copy the webhook signing secret from the CLI output and add it to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`.

#### Production

1. Deploy your application and copy the webhook URL (e.g., `https://your-domain.com/api/webhooks`).

2. In your Stripe dashboard, go to Developers → Webhooks and add an endpoint:

   - URL: `https://your-domain.com/api/webhooks`
   - Events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. Copy the webhook signing secret and add it to your production environment variables as `STRIPE_WEBHOOK_SECRET`.

## Testing

Use test cards for testing payments. Common test cards:

- `4242 4242 4242 4242` - Successful payment
- `4000 0027 6000 3184` - 3D Secure authentication required

## Deployment

This application can be deployed to any platform that supports Next.js, such as [Vercel](https://vercel.com), Netlify, or your own infrastructure.

Make sure to set all required environment variables in your deployment platform.

## Project Structure

- `app/` - Next.js app directory with pages and components
  - `dashboard/` - User dashboard with subscription status and protected actions
  - `login/` - Login page
  - `signup/` - Sign up page
  - `actions/` - Server actions for auth and subscriptions
  - `api/` - API routes (webhooks, protected server endpoints)
- `lib/` - Client configurations (Stripe, Supabase)
- `supabase/migrations/` - Database migrations
- `components/` - React components
- `utils/` - Utility functions

## How It Works

1. **Authentication**: Users sign up/login with email via Supabase Auth
2. **Subscription**: Users can subscribe via Stripe Checkout
3. **Webhook Sync**: Stripe webhooks update subscription status in Supabase database
4. **Access Control**: Dashboard shows subscription status and protected API buttons
5. **Protected Routes**: `/api/server/[endpoint]` routes check for active subscription before allowing access

## Mirroring

Tangled is the primary git host. All pushes to `main`, `develop`, and `feature/*` branches are automatically mirrored to GitHub under `mirror/<branch-name>` via the Tangled CI pipeline at `.tangled/workflows/mirror.yml`. No manual multi-remote setup is needed.

## How to Contribute

1. Clone: `git clone git@tangled.org:samsour.de/eny-space`
2. Branch: `git checkout -b feature/your-feature`
3. Work: edit → `git add . && git commit -m "your message"`
4. Push: `git push origin feature/your-feature`
