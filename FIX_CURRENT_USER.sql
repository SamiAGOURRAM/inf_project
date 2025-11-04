-- =====================================================
-- FIX: Créer le profil pour l'utilisateur actuel
-- =====================================================
-- Exécutez ceci dans Supabase SQL Editor

-- Step 1: Vérifier l'utilisateur sans profil
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.confirmed_at,
    u.raw_user_meta_data->>'role' as meta_role,
    u.raw_user_meta_data->>'company_name' as meta_company,
    p.id as has_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id = '55bb279d-3d73-4823-aa8b-a63edaca1686';

-- Step 2: Créer le profil
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
    COALESCE((u.raw_user_meta_data->>'role')::user_role, 'company'::user_role) as role
FROM auth.users u
WHERE u.id = '55bb279d-3d73-4823-aa8b-a63edaca1686'
ON CONFLICT (id) DO NOTHING;

-- Step 3: Créer la company
INSERT INTO public.companies (profile_id, company_name, is_verified, verification_status)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'company_name', 'Company Name') as company_name,
    false as is_verified,
    'pending' as verification_status
FROM auth.users u
WHERE u.id = '55bb279d-3d73-4823-aa8b-a63edaca1686'
ON CONFLICT (profile_id) DO NOTHING;

-- Step 4: Vérifier que tout est créé
SELECT 
    u.id,
    u.email,
    p.role,
    c.company_name,
    c.verification_status
FROM auth.users u
INNER JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.profile_id = p.id
WHERE u.id = '55bb279d-3d73-4823-aa8b-a63edaca1686';
