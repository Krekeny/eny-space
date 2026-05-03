-- Track which PDS service has been provisioned for each user
-- This lets the dashboard fetch the correct service via GET /service/{id}
CREATE TABLE IF NOT EXISTS pds_services (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pds_service_id BIGINT,
  hostname TEXT,
  status TEXT NOT NULL DEFAULT 'provisioning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pds_services ENABLE ROW LEVEL SECURITY;

-- Users can see only their own provisioned PDS
DROP POLICY IF EXISTS "Users can view own pds services" ON pds_services;
CREATE POLICY "Users can view own pds services"
  ON pds_services
  FOR SELECT
  USING (auth.uid() = user_id);

-- Keep updated_at current
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

