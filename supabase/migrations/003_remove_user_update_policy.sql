-- Remove the UPDATE policy that allows users to update their own subscriptions
-- This is a security fix: users should NOT be able to modify subscription status
-- All updates must come from webhooks (service role) or validated server actions

-- This migration is safe to run multiple times
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscriptions' 
    AND policyname = 'Users can update own subscriptions'
  ) THEN
    DROP POLICY "Users can update own subscriptions" ON subscriptions;
  END IF;
END $$;
