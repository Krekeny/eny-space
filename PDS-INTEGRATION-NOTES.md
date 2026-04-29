## PDS integration overview

### End-to-end flow

- **Stripe checkout**
  - User selects a plan on the pricing page.
  - Plan context is passed via URL params (`auto_checkout`, `pds_plan`, `pds_disksize_gb`, etc.) through `/signup` or `/login` to `/dashboard`.
  - `DashboardClient` calls `createSubscriptionCheckout(priceId, options)` with:
    - `username` (optional, normalized)
    - `hostname` (optional, cleaned; falls back to `<username>.eny.k8s.frx.pub`)
    - `disksizeGb` (derived from plan or override)
  - `createSubscriptionCheckout` encodes this into Stripe Checkout metadata:
    - `user_id`, `user_email`
    - `pds_username`
    - `pds_hostname_base`
    - `pds_disksize_gb`

- **Stripe webhook → provisioning**
  - Stripe sends `checkout.session.completed` to `/api/webhooks` (Vercel URL, optionally with `x-vercel-protection-bypass` query param).
  - The webhook:
    - Verifies the event using `STRIPE_WEBHOOK_SECRET`.
    - Stores `user_id ↔ stripe_customer_id` in `subscriptions` (minimal mapping).
    - Derives provisioning parameters:
      - `pds_username` (normalized from metadata or `user_email`)
      - `pds_hostname_base` (metadata or `<username>.eny.k8s.frx.pub`)
      - `disksizeGb` (metadata or `"10"`).
    - Calls `provisionPdsForUser` with:
      - `userId`, `userEmail`
      - `pdsUsername`, `pdsHostnameBase`, `disksizeGb`.

- **`provisionPdsForUser`**
  - Uses Supabase admin client (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) to read/write `pds_services`.
  - Idempotency:
    - If `pds_services` already has a row with a non-null `pds_service_id`, it skips redeploy.
    - If `status` is **not** in `{ "deploy_failed", "deploy_succeeded_no_id" }`, it also skips redeploy.
    - Otherwise it proceeds to deploy again.
  - Calls `POST https://k8s-pds.frx.pub/api/v1/deploy` with Bearer **`PDS_API_TOKEN`** and JSON body:

    ```json
    {
      "username": "<pdsUsername>",
      "password": "<generated base64url>",
      "email": "<userEmail>",
      "hostname": "<pdsHostnameBase>",
      "disksize": <number in GiB>
    }
    ```

  - Backend currently expects `hostname` to be a bare FQDN (no scheme, no path).

  - Expects a 2xx response with JSON containing an id somewhere. Current backend returns:

    ```json
    {
      "...": "...",
      "serviceId": 800
    }
    ```

  - The code extracts `maybeServiceId` from (in order):
    - `service_id`
    - `serviceId`
    - `id`
    - `service.id`
    - `data.id`
    - `data.serviceId`
  - It upserts into `pds_services`:
    - `user_id`
    - `pds_service_id` (number or `null`)
    - `hostname`
    - `status`:
      - `"provisioning"` when `pds_service_id` is set.
      - `"deploy_succeeded_no_id"` when deploy succeeded but no id was found.
      - `"deploy_failed"` on deploy error.

### Database schema (`pds_services`)

```sql
CREATE TABLE IF NOT EXISTS pds_services (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pds_service_id BIGINT,
  hostname TEXT,
  status TEXT NOT NULL DEFAULT 'provisioning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pds_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pds services" ON pds_services;
CREATE POLICY "Users can view own pds services"
  ON pds_services
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_pds_services_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pds_services_updated_at ON pds_services;
CREATE TRIGGER update_pds_services_updated_at
  BEFORE UPDATE ON pds_services
  FOR EACH ROW
  EXECUTE FUNCTION update_pds_services_updated_at_column();
```

- One PDS per `user_id` (PK on `user_id`).
- `status` values used today: `"provisioning"`, `"deploy_failed"`, `"deploy_succeeded_no_id"`.

### PDS service fetch (`app/api/pds/service/route.ts`)

- Authenticates the current user with the normal Supabase client.
- Reads `pds_services` row for `user_id`:
  - If no row or `pds_service_id` is `null`, returns `404` with a simple message.
- Builds `GET` URL to PDS API:

  ```text
  GET https://k8s-pds.frx.pub/api/v1/service/{pds_service_id}
  ```

- Sends:
  - `Accept: application/json`
  - `X-Requested-With: XMLHttpRequest`
  - `Authorization: Bearer PDS_API_TOKEN`
- If `content-type` is JSON:
  - Parses body.
  - Handles double-encoded JSON strings by `JSON.parse` when possible.
  - On non-2xx, returns `502` with `{ error, status, body }` for debugging.
  - On 2xx, returns the JSON as-is to the dashboard.
- If non-JSON, returns `502` with `{ error, status, contentType, bodyPreview }`.

### Dashboard UI

- `Usage summary` section uses `ServiceDetailsClient mode="stats"` and is fed from `/api/pds/service` (or mock when `PDS_USE_MOCK=true`).
- Details section uses `ServiceDetailsClient mode="details"`:
  - Shows `id`, `service`, `namespace`, `state`, `kubeconfig_id`.
  - Shows `encrypted_config` fields (hostname, email settings, storage size) with `adminPassword` masked.
  - Shows `install_cmd` and timestamps.

### Env vars (server vs client)

- **Server-only (secret)**:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `PDS_API_TOKEN`

- **Client-safe (`NEXT_PUBLIC_*`)**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_STRIPE_PRICE_ID`

These are configured in Vercel for **all environments** (or at least Preview/Production). Webhook and PDS routes only use the server-only keys.
