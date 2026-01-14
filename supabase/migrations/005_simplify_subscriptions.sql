-- Simplify subscriptions table to only store minimal data
-- Stripe API is the source of truth for all subscription details

-- First, drop policies that depend on columns we're removing
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;

-- Drop unnecessary columns (keep only user_id and stripe_customer_id)
ALTER TABLE subscriptions 
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_price_id,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS current_period_start,
  DROP COLUMN IF EXISTS current_period_end,
  DROP COLUMN IF EXISTS cancel_at_period_end;

-- Recreate a simpler insert policy (no status check needed since we don't store it)
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Keep only essential columns
-- user_id: links to Supabase auth user
-- stripe_customer_id: used to query Stripe API for subscription details
