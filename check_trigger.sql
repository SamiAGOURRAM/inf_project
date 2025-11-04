-- Check if trigger exists
SELECT 
    trigger_name, 
    event_object_table, 
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
   OR trigger_schema = 'public'
ORDER BY trigger_name;

-- Check if function exists
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
