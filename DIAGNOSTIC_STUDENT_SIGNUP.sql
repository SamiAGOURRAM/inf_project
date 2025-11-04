-- =====================================================
-- DIAGNOSTIC AND FIX: Student Signup and Profile Issues
-- =====================================================

-- ============================
-- PART 1: DIAGNOSTIC
-- ============================

-- 1. Check all users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.confirmed_at,
    u.email_confirmed_at,
    u.raw_user_meta_data->>'role' as meta_role,
    u.raw_user_meta_data->>'full_name' as meta_name,
    u.raw_user_meta_data->>'is_deprioritized' as meta_deprioritized,
    p.id as has_profile,
    p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 2. Check trigger status
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check all students
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_deprioritized,
    p.created_at,
    u.confirmed_at,
    u.email_confirmed_at
FROM public.profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE p.role = 'student'
ORDER BY p.created_at DESC
LIMIT 20;

-- ============================
-- PART 2: FIX MISSING PROFILES
-- ============================

-- Create profiles for all users without one
INSERT INTO public.profiles (id, email, full_name, role, is_deprioritized, phone)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
    COALESCE((u.raw_user_meta_data->>'role')::user_role, 'student'::user_role) as role,
    COALESCE((u.raw_user_meta_data->>'is_deprioritized')::boolean, false) as is_deprioritized,
    u.raw_user_meta_data->>'phone' as phone
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================
-- PART 3: VERIFY FIX
-- ============================

-- Check if all users now have profiles
SELECT 
    COUNT(*) as users_without_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Show newly created profiles
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_deprioritized,
    p.created_at
FROM public.profiles p
WHERE p.created_at > NOW() - INTERVAL '1 minute'
ORDER BY p.created_at DESC;

-- ============================
-- PART 4: EMAIL CONFIRMATION CHECK
-- ============================

-- Check Supabase email confirmation settings
-- Note: This is configuration, not SQL. Check in Supabase Dashboard:
-- Authentication → Email Auth → Confirm email

-- Users waiting for email confirmation
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.confirmed_at,
    u.email_confirmed_at,
    CASE 
        WHEN u.confirmed_at IS NULL THEN 'Awaiting confirmation'
        ELSE 'Confirmed'
    END as status,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC;
