-- Drop the legacy `status` column on pds_services.
-- It was a write-once deploy breadcrumb ('provisioning' / 'deploy_failed' /
-- 'deploy_succeeded_no_id') that was never read and never advanced. The real
-- signals live elsewhere: provisioned = pds_service_id IS NOT NULL, live state =
-- the backend service state, subscription phase = lifecycle_status.

ALTER TABLE pds_services
  DROP COLUMN IF EXISTS status;
