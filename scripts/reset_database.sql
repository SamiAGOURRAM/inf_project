-- Script pour nettoyer la base de données et recommencer depuis zéro
-- ⚠️ ATTENTION: Ce script supprime TOUTES les données !
-- À exécuter dans Supabase SQL Editor

-- Ordre de suppression (respecter les foreign keys)

-- 1. Supprimer les tentatives de booking
DELETE FROM booking_attempts WHERE true;

-- 2. Supprimer les bookings (ancienne table)
DELETE FROM bookings WHERE true;

-- 3. Supprimer les interview bookings (nouvelle table)
DELETE FROM interview_bookings WHERE true;

-- 4. Supprimer les notifications
DELETE FROM notifications WHERE true;

-- 5. Supprimer les slots
DELETE FROM event_slots WHERE true;

-- 6. Supprimer les offres de stage
DELETE FROM offers WHERE true;

-- 7. Supprimer les participants
DELETE FROM event_participants WHERE true;

-- 8. Supprimer les event registrations (old system)
DELETE FROM event_registrations WHERE true;

-- 9. Supprimer les sessions
DELETE FROM speed_recruiting_sessions WHERE true;

-- 10. Supprimer les time ranges
DELETE FROM event_time_ranges WHERE true;

-- 11. Supprimer les événements
DELETE FROM events WHERE true;

-- 12. Supprimer admin actions log (optionnel)
-- DELETE FROM admin_actions WHERE true;

-- 13. Supprimer les entreprises (optionnel - commenté par défaut)
-- DELETE FROM companies WHERE true;

-- Note: On garde les profiles, companies, et allowed_student_emails
-- pour pouvoir tester avec les comptes existants

-- 14. Vérifier l'état après nettoyage
SELECT 'Events' as table_name, COUNT(*) as count FROM events
UNION ALL
SELECT 'Companies', COUNT(*) FROM companies
UNION ALL
SELECT 'Profiles (Total)', COUNT(*) FROM profiles
UNION ALL
SELECT 'Sessions', COUNT(*) FROM speed_recruiting_sessions
UNION ALL
SELECT 'Participants', COUNT(*) FROM event_participants
UNION ALL
SELECT 'Event Registrations', COUNT(*) FROM event_registrations
UNION ALL
SELECT 'Slots', COUNT(*) FROM event_slots
UNION ALL
SELECT 'Interview Bookings', COUNT(*) FROM interview_bookings
UNION ALL
SELECT 'Bookings (old)', COUNT(*) FROM bookings
UNION ALL
SELECT 'Offers (Internships)', COUNT(*) FROM offers
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
ORDER BY table_name;

-- Message de confirmation
SELECT '✅ Base de données nettoyée ! Prêt pour les tests.' as status;
