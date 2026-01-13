-- Additional security: Add a check constraint to ensure data integrity
-- Note: RLS policies already prevent users from updating, but this adds an extra layer

-- Ensure status is one of the valid Stripe subscription statuses
ALTER TABLE subscriptions 
  DROP CONSTRAINT IF EXISTS valid_subscription_status;

ALTER TABLE subscriptions
  ADD CONSTRAINT valid_subscription_status 
  CHECK (status IN (
    'incomplete', 
    'incomplete_expired', 
    'trialing', 
    'active', 
    'past_due', 
    'canceled', 
    'unpaid',
    'paused'
  ));
