-- =====================================================
-- FIX: Profile Creation for Invited Users
-- =====================================================
-- Problem: Trigger doesn't fire for invited users, only for signups
-- Solution: Create profile manually when no profile exists

-- Step 1: Check current state
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Step 2: Create profiles for users that don't have one
-- This will create profiles for invited companies
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
    COALESCE((u.raw_user_meta_data->>'role')::user_role, 'student'::user_role) as role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create companies for company users without company record
INSERT INTO public.companies (profile_id, company_name, is_verified, verification_status)
SELECT 
    p.id,
    COALESCE(u.raw_user_meta_data->>'company_name', 'Company Name') as company_name,
    false as is_verified,
    'pending' as verification_status
FROM public.profiles p
INNER JOIN auth.users u ON u.id = p.id
LEFT JOIN public.companies c ON c.profile_id = p.id
WHERE p.role = 'company' 
  AND c.profile_id IS NULL
ON CONFLICT (profile_id) DO NOTHING;

-- Step 4: Verify fix
SELECT 
    u.id,
    u.email,
    p.role,
    c.company_name
FROM auth.users u
INNER JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.profile_id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
