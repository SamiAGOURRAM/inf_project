-- =====================================================
-- FIX 1: Correct get_company_quick_invite_history function
-- =====================================================
-- Problem: event_slots table doesn't have event_id column
-- Solution: Join through offers table to get event_id

CREATE OR REPLACE FUNCTION get_company_quick_invite_history(
  p_company_id uuid
)
RETURNS TABLE (
  event_id uuid,
  event_name text,
  event_date timestamptz,
  total_slots integer,
  booked_slots integer,
  total_offers integer,
  invited_at timestamptz
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as event_id,
    e.name as event_name,
    e.date as event_date,
    
    -- Count slots: event_slots -> offers -> events
    (
      SELECT COUNT(*) 
      FROM event_slots es 
      JOIN offers o ON o.id = es.offer_id
      WHERE o.event_id = e.id AND es.company_id = p_company_id
    )::integer as total_slots,
    
    -- Count booked slots: interview_bookings -> event_slots -> offers -> events
    (
      SELECT COUNT(*) 
      FROM event_slots es 
      JOIN offers o ON o.id = es.offer_id
      JOIN interview_bookings ib ON ib.slot_id = es.id
      WHERE o.event_id = e.id AND es.company_id = p_company_id
    )::integer as booked_slots,
    
    -- Count offers for this company at this event
    (
      SELECT COUNT(*) 
      FROM offers o 
      WHERE o.company_id = p_company_id 
        AND o.event_id = e.id
    )::integer as total_offers,
    
    ep.invited_at
    
  FROM event_participants ep
  JOIN events e ON e.id = ep.event_id
  WHERE ep.company_id = p_company_id
  ORDER BY e.date DESC;
END;
$$;

COMMENT ON FUNCTION get_company_quick_invite_history IS 
'Fixed: Gets company invite history by joining through offers table (event_slots has no event_id).';

-- =====================================================
-- FIX 2: Add helper function to check if email exists
-- =====================================================

CREATE OR REPLACE FUNCTION check_email_exists(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id uuid;
  v_company_id uuid;
  v_company_name text;
  v_company_code text;
  v_profile_exists boolean;
BEGIN
  -- Check if email exists in auth.users
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = LOWER(p_email)
  LIMIT 1;
  
  IF v_auth_user_id IS NULL THEN
    -- Email doesn't exist
    RETURN jsonb_build_object(
      'exists', false,
      'message', 'Email not found - can invite'
    );
  END IF;
  
  -- Email exists, check if they have a profile
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_auth_user_id
  ) INTO v_profile_exists;
  
  -- Check if they have a company
  SELECT id, company_name, company_code 
  INTO v_company_id, v_company_name, v_company_code
  FROM companies
  WHERE profile_id = v_auth_user_id
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'exists', true,
    'auth_user_id', v_auth_user_id,
    'has_profile', v_profile_exists,
    'has_company', v_company_id IS NOT NULL,
    'company_id', v_company_id,
    'company_name', v_company_name,
    'company_code', v_company_code,
    'message', CASE 
      WHEN v_company_id IS NOT NULL THEN 'Company exists - use re-invite'
      WHEN v_profile_exists THEN 'User exists but no company - can link'
      ELSE 'Auth user exists but no profile - can complete signup'
    END
  );
END;
$$;

COMMENT ON FUNCTION check_email_exists IS 
'Checks if email exists in auth.users and returns company info if found. Use before inviting to decide: new invite vs re-invite.';

-- =====================================================
-- FIX 3: Update quick_invite_company to handle re-invites
-- =====================================================

-- Drop existing function with all possible signatures
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

  -- Create company record (profile_id will be NULL until user completes signup)
  INSERT INTO companies (
    profile_id,
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
      'error', 'Company with this name or code already exists',
      'message', 'Try a different company name or check if already invited'
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
'Fixed: Checks if email exists before inviting. Returns different actions: send_signup_email (new), send_notification_email (existing), or use_resend_button (already invited).';

-- =====================================================
-- DONE! 🎉
-- =====================================================
-- WHAT THIS FIXES:
-- 
-- 1. ✅ Fixed get_company_quick_invite_history function
--    - Now correctly joins through offers table to get event_id
--    - No more "column events.event_id does not exist" error
--
-- 2. ✅ Added check_email_exists function
--    - Checks if email already registered
--    - Returns company info if exists
--    - Prevents duplicate auth.users entries
--
-- 3. ✅ Updated quick_invite_company function
--    - Detects if email already exists
--    - Returns appropriate action:
--      * send_signup_email (new company)
--      * send_notification_email (existing company, new event)
--      * use_resend_button (already invited to this event)
--    - Prevents Supabase "User already registered" error
--
-- USAGE IN FRONTEND:
-- 
-- const { data } = await supabase.rpc('quick_invite_company', {
--   p_email: email,
--   p_company_name: name,
--   p_event_id: eventId
-- });
--
-- if (data.success) {
--   if (data.action === 'send_signup_email') {
--     // New company - send auth.signUp()
--     await supabase.auth.signUp({ email, password, ... });
--   } else if (data.action === 'send_notification_email') {
--     // Existing company - send custom notification
--     // (Don't use auth.signUp - they already have account)
--     await sendCustomEmail(email, data.event_name);
--   } else if (data.action === 'use_resend_button') {
--     // Already invited - show error message
--     alert(data.message);
--   }
-- }
-- =====================================================
