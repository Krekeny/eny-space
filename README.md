# eny.space

your data, your space, use it enywhere.

A full-stack TypeScript application using Next.js for processing hosting service purchases.

## Features

- **Checkout** - Custom amount hosting service purchases with hosted checkout
- **Payment Elements** - Custom payment form with Payment Element
- **Webhook handling** - Server-side webhook processing for payment events

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Next.js Server Actions and Route Handlers

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A payment processor account

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

Get your API keys from your payment processor dashboard.

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

1. Install the payment processor CLI and link your account.

2. Start webhook forwarding to your local server:

```bash
# Example command - adjust based on your payment processor
webhook listen --forward-to localhost:3000/api/webhooks
```

3. Copy the webhook secret from the CLI output and add it to your `.env.local` file.

#### Production

1. Deploy your application and copy the webhook URL (e.g., `https://your-domain.com/api/webhooks`).

2. Create a webhook endpoint in your payment processor dashboard.

3. Add the webhook signing secret to your production environment variables.

## Testing

Use test cards for testing payments. Common test cards:

- `4242 4242 4242 4242` - Successful payment
- `4000 0027 6000 3184` - 3D Secure authentication required

## Deployment

This application can be deployed to any platform that supports Next.js, such as [Vercel](https://vercel.com), Netlify, or your own infrastructure.

Make sure to set all required environment variables in your deployment platform.

## Project Structure

- `app/` - Next.js app directory with pages and components
- `app/actions/` - Server actions for payment operations
- `app/api/webhooks/` - Webhook handler route
- `lib/` - Payment processor client configuration
- `components/` - React components for payment forms
- `utils/` - Utility functions

## Multi-Remote Git Setup

This repo syncs to two servers (tangled.sh primary, GitHub mirror) using a custom `all` remote. Running `git push all` updates both simultaneously.

### Current Config

```bash
all     git@tangled.sh:samsour.de/eny-space (fetch)
all     git@github.com:Krekeny/eny-space.git (push)
all     git@tangled.sh:samsour.de/eny-space (push)
origin  git@tangled.sh:samsour.de/eny-space (fetch)
origin  git@tangled.sh:samsour.de/eny-space (push)
```

Note: I previously had `all` with `git@tangled.sh:samsour.de/eny-space` as **fetch only**, so pushes were only going to GitHub and the tangled.sh repo wasn’t in sync. The config above fixes that by adding tangled.sh as a push URL on `all`.

### Setup (New Clones)

```bash
# Clone primary
git clone git@tangled.sh:samsour.de/eny-space

# Add GitHub mirror + tangled push
cd eny-space
git remote rename origin tangled
git remote add all git@tangled.sh:samsour.de/eny-space
git remote set-url --add --push all git@github.com:Krekeny/eny-space.git
git remote set-url --add --push all git@tangled.sh:samsour.de/eny-space

# Push everything
git push all --all
git push all --tags
```

### How to Contribute

1. Clone: `git clone git@tangled.sh:samsour.de/eny-space`
2. Branch: `git checkout -b your-feature`
3. Work: edit → `git add . && git commit -m "Your message"`
4. Push: `git push all` (syncs both servers!)
5. Update: `git fetch --all && git checkout main && git pull tangled main`

Pro tip: add an alias `pushall="git push all"` in your shell config (e.g. `~/.bashrc` or `~/.zshrc`) for speed.
