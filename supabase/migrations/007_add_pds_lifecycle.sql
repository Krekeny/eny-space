-- PDS lifecycle after a subscription ends: active -> grace -> suspended -> deleted.
-- See lib/pds-lifecycle.ts for the durations and semantics.

ALTER TABLE pds_services
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS lifecycle_reason TEXT,        -- 'canceled' | 'past_due'
  ADD COLUMN IF NOT EXISTS grace_until TIMESTAMPTZ,      -- grace -> suspended
  ADD COLUMN IF NOT EXISTS delete_at TIMESTAMPTZ;        -- suspended -> deleted

-- Lets the lifecycle scheduler find rows due for a transition cheaply.
CREATE INDEX IF NOT EXISTS pds_services_lifecycle_idx
  ON pds_services (lifecycle_status, grace_until, delete_at);
