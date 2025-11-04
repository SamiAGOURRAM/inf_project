-- Fix for profile creation trigger
-- Run this in Supabase SQL Editor to fix "Database error saving new user"

-- First, let's check the existing trigger
-- The issue is likely that the trigger tries to create a profile
-- but the company already exists (created by quick_invite_company)

-- Drop and recreate the profile creation trigger with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  existing_company_id uuid;
BEGIN
  -- Get the role from metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'candidate');
  
  -- Create profile (this should always succeed)
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  -- If role is 'company', check if company already exists (from Quick Invite)
  IF user_role = 'company' THEN
    -- Look for existing company with NULL profile_id
    -- The Quick Invite function creates company with profile_id = NULL
    -- We need to find it and link it to this new profile
    
    -- Try to find company by company_code from metadata (most reliable)
    IF NEW.raw_user_meta_data->>'company_code' IS NOT NULL THEN
      SELECT id INTO existing_company_id
      FROM companies
      WHERE profile_id IS NULL
        AND company_code = NEW.raw_user_meta_data->>'company_code'
      LIMIT 1;
    END IF;
    
    -- If not found by code, try by company name
    IF existing_company_id IS NULL AND NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
      SELECT id INTO existing_company_id
      FROM companies
      WHERE profile_id IS NULL
        AND company_name = NEW.raw_user_meta_data->>'company_name'
      LIMIT 1;
    END IF;
    
    -- If company exists (invited via Quick Invite), link it
    IF existing_company_id IS NOT NULL THEN
      UPDATE companies
      SET profile_id = NEW.id,
          updated_at = NOW()
      WHERE id = existing_company_id;
      
      RAISE NOTICE 'Linked existing company % to new profile %', existing_company_id, NEW.id;
    ELSE
      -- No existing company, create new one
      INSERT INTO public.companies (
        profile_id,
        company_name,
        company_code,
        industry,
        is_verified,
        verification_status,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'),
        COALESCE(NEW.raw_user_meta_data->>'company_code', generate_company_code(COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'))),
        COALESCE(NEW.raw_user_meta_data->>'industry', 'Other'),
        false, -- Not verified by default (unless invited by admin)
        'pending',
        NOW(),
        NOW()
      )
      ON CONFLICT (profile_id) DO NOTHING; -- Prevent duplicate company creation
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 
'Handles new user creation: creates profile and links to existing company (if invited) or creates new company.';
