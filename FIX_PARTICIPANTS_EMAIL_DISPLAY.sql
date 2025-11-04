-- =====================================================
-- FIX: Participants Email Display (403 Forbidden Error)
-- =====================================================
-- Problem: Cannot use admin.listUsers() from client (requires service_role key)
-- Solution: Create SQL function to get emails for participants

-- =====================================================
-- OPTION 1: Store email in companies table (RECOMMENDED)
-- =====================================================

-- Add email column to companies table (if not exists)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS email text;

-- Create unique index on email (only for non-NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS companies_email_unique_idx 
ON companies (email) 
WHERE email IS NOT NULL;

COMMENT ON COLUMN companies.email IS 
'Email address for company. Populated when invited via Quick Invite or when user registers.';

-- Update quick_invite_company to store email
DROP FUNCTION IF EXISTS quick_invite_company(text, text, uuid);
DROP FUNCTION IF EXISTS quick_invite_company(text, text, uuid, text);
DROP FUNCTION IF EXISTS quick_invite_company(text, text, uuid, text, text);
DROP FUNCTION IF EXISTS quick_invite_company(text, text, uuid, text, text, boolean);

CREATE OR REPLACE FUNCTION quick_invite_company(
  p_email text,
  p_company_name text,
  p_event_id uuid,
  p_industry text DEFAULT 'Other',
  p_website text DEFAULT NULL,
  p_force_reinvite boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id uuid;
  v_company_code text;
  v_participant_exists boolean;
  v_event_name text;
  v_existing_email_check jsonb;
  v_auth_user_id uuid;
BEGIN
  -- Validate inputs
  IF p_email IS NULL OR p_company_name IS NULL OR p_event_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing required fields: email, company_name, or event_id'
    );
  END IF;

  -- Check if email already exists in auth.users
  v_existing_email_check := check_email_exists(p_email);
  
  -- If email exists and has company, handle re-invite
  IF (v_existing_email_check->>'exists')::boolean = true 
     AND (v_existing_email_check->>'has_company')::boolean = true THEN
    
    v_company_id := (v_existing_email_check->>'company_id')::uuid;
    v_company_code := v_existing_email_check->>'company_code';
    
    -- Check if already invited to THIS event
    SELECT EXISTS (
      SELECT 1 FROM event_participants 
      WHERE event_id = p_event_id AND company_id = v_company_id
    ) INTO v_participant_exists;
    
    IF v_participant_exists THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Company already invited to this event',
        'company_id', v_company_id,
        'company_code', v_company_code,
        'action', 'use_resend_button',
        'message', 'This company is already invited. Use the "Resend Email" button in the Participants page.'
      );
    ELSE
      -- Add to this event (company exists but not invited to this event)
      INSERT INTO event_participants (event_id, company_id, invited_at)
      VALUES (p_event_id, v_company_id, NOW());
      
      SELECT name INTO v_event_name FROM events WHERE id = p_event_id;
      
      RETURN jsonb_build_object(
        'success', true,
        'company_id', v_company_id,
        'company_code', v_company_code,
        'company_name', v_existing_email_check->>'company_name',
        'message', 'Existing company added to event',
        'action', 'send_notification_email',
        'event_name', v_event_name,
        'email', p_email,
        'is_existing_company', true
      );
    END IF;
  END IF;

  -- If email exists but no company, return error (shouldn't invite as company)
  IF (v_existing_email_check->>'exists')::boolean = true 
     AND (v_existing_email_check->>'has_company')::boolean = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email already registered as non-company user',
      'message', 'This email is already registered in the system but not as a company. Cannot invite as company.',
      'action', 'use_different_email'
    );
  END IF;

  -- NEW COMPANY - Proceed with normal Quick Invite flow
  -- Generate unique company code
  v_company_code := generate_company_code(p_company_name);
  
  -- Ensure code is unique
  WHILE EXISTS (SELECT 1 FROM companies WHERE company_code = v_company_code) LOOP
    v_company_code := generate_company_code(p_company_name);
  END LOOP;

  -- Create company record with EMAIL stored
  INSERT INTO companies (
    profile_id,
    email,  -- NEW: Store email directly
    company_name,
    company_code,
    industry,
    website,
    is_verified,
    verification_status,
    created_at,
    updated_at
  )
  VALUES (
    NULL, -- Will be linked when user sets password
    LOWER(p_email), -- Store email in lowercase
    p_company_name,
    v_company_code,
    p_industry,
    p_website,
    true, -- Pre-verified since invited by admin
    'verified',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_company_id;

  -- Add to event_participants
  INSERT INTO event_participants (event_id, company_id, invited_at)
  VALUES (p_event_id, v_company_id, NOW());

  -- Get event name for email
  SELECT name INTO v_event_name FROM events WHERE id = p_event_id;

  -- Return success with all info needed for email
  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_company_id,
    'company_code', v_company_code,
    'company_name', p_company_name,
    'message', 'Company invited successfully',
    'action', 'send_signup_email',
    'event_name', v_event_name,
    'event_id', p_event_id,
    'email', p_email,
    'is_existing_company', false
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Company with this email, name or code already exists',
      'message', 'Try a different email or company name, or check if already invited'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Unexpected error during invite'
    );
END;
$$;

COMMENT ON FUNCTION quick_invite_company IS 
'Fixed: Stores email in companies table for easy retrieval. No need for admin.listUsers() from client.';

-- =====================================================
-- Update handle_new_user to populate email from auth
-- =====================================================

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
  ON CONFLICT (id) DO NOTHING;
  
  -- If role is 'company', check if company already exists (from Quick Invite)
  IF user_role = 'company' THEN
    -- Try to find company by company_code (most reliable)
    IF NEW.raw_user_meta_data->>'company_code' IS NOT NULL THEN
      SELECT id INTO existing_company_id
      FROM companies
      WHERE profile_id IS NULL
        AND company_code = NEW.raw_user_meta_data->>'company_code'
      LIMIT 1;
    END IF;
    
    -- Try by email if not found by code
    IF existing_company_id IS NULL THEN
      SELECT id INTO existing_company_id
      FROM companies
      WHERE profile_id IS NULL
        AND email = LOWER(NEW.email)
      LIMIT 1;
    END IF;
    
    -- If company exists (invited via Quick Invite), link it
    IF existing_company_id IS NOT NULL THEN
      UPDATE companies
      SET profile_id = NEW.id,
          email = LOWER(NEW.email), -- Ensure email is populated
          updated_at = NOW()
      WHERE id = existing_company_id;
      
      RAISE NOTICE 'Linked existing company % to new profile %', existing_company_id, NEW.id;
    ELSE
      -- No existing company, create new one
      INSERT INTO public.companies (
        profile_id,
        email,  -- NEW: Store email
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
        LOWER(NEW.email), -- Store email
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'),
        COALESCE(NEW.raw_user_meta_data->>'company_code', generate_company_code(COALESCE(NEW.raw_user_meta_data->>'company_name', 'Unnamed Company'))),
        COALESCE(NEW.raw_user_meta_data->>'industry', 'Other'),
        false,
        'pending',
        NOW(),
        NOW()
      )
      ON CONFLICT (profile_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger is set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- MIGRATION: Populate email for existing companies
-- =====================================================

-- For companies with profile_id, get email from profiles
UPDATE companies c
SET email = p.email
FROM profiles p
WHERE c.profile_id = p.id
  AND c.email IS NULL;

-- =====================================================
-- DONE! 🎉
-- =====================================================
-- NOW YOU CAN QUERY:
--
-- SELECT 
--   c.id,
--   c.company_name,
--   c.company_code,
--   c.email,  -- ✅ Email directly available!
--   c.profile_id
-- FROM companies c
-- JOIN event_participants ep ON ep.company_id = c.id
-- WHERE ep.event_id = 'your-event-id';
--
-- NO MORE:
-- - ❌ admin.listUsers() calls from client
-- - ❌ 403 Forbidden errors
-- - ❌ Complex email retrieval logic
--
-- BENEFITS:
-- - ✅ Email stored in companies table
-- - ✅ Fast queries (no joins to auth.users)
-- - ✅ Works from client safely
-- - ✅ Unique constraint prevents duplicates
-- =====================================================
