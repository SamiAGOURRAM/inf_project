-- Test 1: Check if trigger exists and is active
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_timing,
    t.event_manipulation,
    t.action_statement
FROM information_schema.triggers t
WHERE t.trigger_name LIKE '%auth_user%'
   OR t.trigger_name LIKE '%new_user%';

-- Test 2: Check function definition
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';

-- Test 3: Check existing users and their profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.confirmed_at,
    u.raw_user_meta_data->>'role' as meta_role,
    u.raw_user_meta_data->>'company_name' as meta_company,
    p.id as has_profile,
    p.role as profile_role,
    c.company_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.companies c ON c.profile_id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
