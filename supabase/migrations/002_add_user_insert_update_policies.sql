-- Add policies to allow users to insert and update their own subscriptions
-- This is needed for the checkout flow to work without requiring service role key
-- NOTE: This migration is now obsolete - we removed UPDATE policy for security
-- Keeping it for migration history, but it will be skipped if policies already exist

-- Policy: Users can insert their own subscription records (for initial customer creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subscriptions' 
    AND policyname = 'Users can insert own subscriptions'
  ) THEN
    CREATE POLICY "Users can insert own subscriptions"
      ON subscriptions
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
