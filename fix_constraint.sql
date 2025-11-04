-- Fix for the verified_fields_consistent constraint
-- Run this in Supabase SQL Editor

-- Drop the problematic constraint
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS verified_fields_consistent;

-- Recreate with more flexible rules for invited companies
ALTER TABLE companies
ADD CONSTRAINT verified_fields_consistent CHECK (
  -- If NOT verified, no constraints
  (NOT is_verified) OR
  -- If verified AND has profile (registered user), require all fields
  (is_verified AND profile_id IS NOT NULL AND company_name IS NOT NULL AND industry IS NOT NULL) OR
  -- If verified BUT no profile yet (invited company), only require company_name
  (is_verified AND profile_id IS NULL AND company_name IS NOT NULL)
);
