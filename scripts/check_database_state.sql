-- Script pour vérifier l'état actuel de la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. Compter les événements
SELECT 'Events' as table_name, COUNT(*) as count FROM events
UNION ALL
SELECT 'Companies', COUNT(*) FROM companies
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Sessions', COUNT(*) FROM speed_recruiting_sessions
UNION ALL
SELECT 'Participants', COUNT(*) FROM event_participants
UNION ALL
SELECT 'Slots', COUNT(*) FROM event_slots
UNION ALL
SELECT 'Bookings', COUNT(*) FROM interview_bookings
UNION ALL
SELECT 'Phases', COUNT(*) FROM event_phases;

-- 2. Lister les événements existants
SELECT 
  id,
  name,
  date,
  location,
  created_at
FROM events
ORDER BY date DESC;

-- 3. Lister les entreprises
SELECT 
  c.id,
  c.company_name,
  c.industry,
  p.email,
  c.created_at
FROM companies c
JOIN profiles p ON c.profile_id = p.id
ORDER BY c.created_at DESC;

-- 4. Vérifier les triggers sont bien installés
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (
    trigger_name LIKE '%auto%' 
    OR trigger_name LIKE '%generate%'
  )
ORDER BY trigger_name;

-- 5. Vérifier les sessions existantes
SELECT 
  s.id,
  s.session_name,
  s.start_time,
  s.end_time,
  s.interview_duration_minutes,
  e.name as event_name
FROM speed_recruiting_sessions s
JOIN events e ON s.event_id = e.id
ORDER BY e.date DESC, s.start_time;

-- 6. Vérifier les participants
SELECT 
  ep.id,
  e.name as event_name,
  c.company_name,
  ep.invited_at
FROM event_participants ep
JOIN events e ON ep.event_id = e.id
JOIN companies c ON ep.company_id = c.id
ORDER BY ep.invited_at DESC;

-- 7. Vérifier l'auto-génération des slots
SELECT 
  e.name as event_name,
  es.session_name,
  c.company_name,
  COUNT(evs.id) as slot_count,
  MIN(evs.start_time) as first_slot,
  MAX(evs.end_time) as last_slot
FROM event_slots evs
JOIN events e ON evs.event_id = e.id
LEFT JOIN speed_recruiting_sessions es ON evs.session_id = es.id
JOIN companies c ON evs.company_id = c.id
GROUP BY e.name, es.session_name, c.company_name
ORDER BY e.name, es.session_name;
