# Guide de Maintenance Annuelle - INF Platform 2.0

## 📅 Procédure de Reset pour INF 2026, 2027, etc.

Ce document détaille la procédure **EXACTE** à suivre chaque année pour préparer la plateforme pour le prochain événement INF.

---

## ⏰ Timeline Recommandée

### **6 Semaines Avant l'Événement**
- [ ] Reset de la base de données
- [ ] Mise à jour de la configuration événementielle
- [ ] Tests du système

### **4 Semaines Avant**
- [ ] Vérification des entreprises partenaires
- [ ] Génération des créneaux
- [ ] Communication aux utilisateurs

### **2 Semaines Avant**
- [ ] Tests de charge
- [ ] Formation des admins
- [ ] Dry run complet

### **1 Semaine Avant**
- [ ] Ouverture des inscriptions
- [ ] Monitoring intensif

### **Jour J - 1**
- [ ] Vérifications finales
- [ ] Ouverture de la Phase 1

---

## 🗑️ Étape 1 : Reset de la Base de Données

### Option A : Reset Complet (Recommandé pour Production)

**⚠️ ATTENTION : Cette opération est IRRÉVERSIBLE**

```sql
-- Exécuter dans Supabase SQL Editor
-- Sauvegarde préalable recommandée !

BEGIN;

-- 1. Archiver les données de l'année précédente (optionnel)
CREATE TABLE IF NOT EXISTS archive_2025_bookings AS 
SELECT * FROM public.bookings;

CREATE TABLE IF NOT EXISTS archive_2025_event_slots AS 
SELECT * FROM public.event_slots;

CREATE TABLE IF NOT EXISTS archive_2025_offers AS 
SELECT * FROM public.offers;

-- 2. Nettoyer les données de l'événement
DELETE FROM public.booking_attempts;
DELETE FROM public.bookings;
DELETE FROM public.event_slots;
DELETE FROM public.offers;

-- 3. Reset des statuts entreprises (ré-vérification annuelle)
UPDATE public.companies 
SET 
    is_verified = false,
    verified_at = NULL,
    verified_by = NULL;

-- 4. Reset des flags étudiants
UPDATE public.profiles 
SET is_deprioritized = false 
WHERE role = 'student';

-- 5. Nettoyer les profils inactifs (optionnel)
-- DELETE FROM public.profiles 
-- WHERE last_login_at < NOW() - INTERVAL '12 months'
-- AND role = 'student';

COMMIT;

-- 6. Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY public.slot_availability;

-- 7. Vacuum pour optimiser
VACUUM ANALYZE public.bookings;
VACUUM ANALYZE public.event_slots;
```

### Option B : Reset Partiel (Développement)

```sql
-- Uniquement les bookings et slots, garde les entreprises vérifiées
DELETE FROM public.booking_attempts;
DELETE FROM public.bookings;
DELETE FROM public.event_slots;
```

---

## ⚙️ Étape 2 : Configuration de l'Événement

### Via SQL (Direct)

```sql
UPDATE public.event_config SET
    event_name = 'INF 2026',  -- ⬅️ MODIFIER L'ANNÉE
    event_date = '2026-11-19',  -- ⬅️ MODIFIER LA DATE
    
    -- Horaires (à confirmer avec l'organisation)
    event_start_time = '09:00:00',
    event_end_time = '13:00:00',
    
    -- Configuration des créneaux (normalement pas de changement)
    slot_duration_minutes = 10,
    buffer_duration_minutes = 5,
    slot_capacity = 2,
    
    -- Dates des phases (à calculer)
    phase_1_start = '2026-11-16 09:00:00+01',  -- ⬅️ MODIFIER
    phase_1_end = '2026-11-17 23:59:59+01',    -- ⬅️ MODIFIER
    phase_2_start = '2026-11-18 09:00:00+01',  -- ⬅️ MODIFIER
    phase_2_end = '2026-11-19 08:00:00+01',    -- ⬅️ MODIFIER (fin avant l'événement)
    
    -- Limites (normalement pas de changement)
    max_bookings_phase_1 = 3,
    max_bookings_total = 6,
    
    -- État initial
    current_phase = 1,
    is_booking_open = false  -- ⬅️ Ouvrir manuellement plus tard
WHERE id = 1;
```

### Via Dashboard Admin (Recommandé)

1. Se connecter en tant qu'admin
2. Aller dans **Admin → Configuration**
3. Remplir le formulaire :
   - Nom de l'événement : `INF 2026`
   - Date : `2026-11-19`
   - Horaires : `09:00` - `13:00`
   - Dates des phases
4. Sauvegarder

---

## 🏢 Étape 3 : Gestion des Entreprises

### 3.1 Vérifier les Entreprises Partenaires

1. **Via Dashboard Admin → Entreprises**
   - Voir la liste des entreprises en attente
   - Vérifier chaque entreprise
   - Cliquer sur "Vérifier" pour activer

2. **Via SQL (en masse)**
   ```sql
   -- Lister les entreprises non vérifiées
   SELECT id, name, email, created_at 
   FROM public.companies c
   JOIN public.profiles p ON p.company_id = c.id
   WHERE c.is_verified = false;
   
   -- Vérifier une entreprise spécifique
   SELECT public.fn_verify_company('company-uuid-here');
   
   -- Vérifier plusieurs en masse
   UPDATE public.companies 
   SET is_verified = true, verified_at = NOW()
   WHERE name IN ('TechCorp', 'Innovation Labs', ...);
   ```

### 3.2 Demander aux Entreprises de Créer leurs Offres

Les entreprises vérifiées doivent :
1. Se connecter
2. Aller dans **Mon Entreprise → Offres**
3. Créer leurs offres de stage avec :
   - Titre
   - Description
   - Tag d'intérêt (Opérationnel / Administratif / Les deux)

---

## 📅 Étape 4 : Génération des Créneaux

### 4.1 Via Dashboard Admin (Recommandé)

1. Aller dans **Admin → Créneaux**
2. Vérifier la configuration :
   - Date de l'événement : affichée depuis `event_config`
   - Horaires : `09:00 - 13:00`
   - Durée : `10 min` + `5 min buffer`
3. Sélectionner les entreprises
4. Cliquer sur **"Générer les créneaux"**
5. Vérifier le message de confirmation (ex: "120 créneaux créés pour 5 entreprises")

### 4.2 Via SQL (Si besoin)

```sql
-- Lister toutes les entreprises vérifiées
SELECT id, name FROM public.companies WHERE is_verified = true;

-- Générer pour toutes les entreprises vérifiées
SELECT public.fn_generate_event_slots(
    ARRAY(SELECT id FROM public.companies WHERE is_verified = true)
);

-- Ou pour des entreprises spécifiques
SELECT public.fn_generate_event_slots(
    ARRAY[
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    ]::UUID[]
);
```

### 4.3 Vérifier les Créneaux Générés

```sql
-- Compter les créneaux par entreprise
SELECT 
    c.name,
    COUNT(es.id) AS total_slots,
    MIN(es.start_time) AS first_slot,
    MAX(es.end_time) AS last_slot
FROM public.companies c
JOIN public.event_slots es ON es.company_id = c.id
WHERE c.is_verified = true
GROUP BY c.id, c.name
ORDER BY c.name;

-- Vérifier les horaires (doivent respecter 10min + 5min)
SELECT 
    start_time,
    end_time,
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS duration_minutes
FROM public.event_slots
ORDER BY start_time
LIMIT 10;

-- Attendu : duration = 10 min, gaps de 5 min entre les slots
```

---

## 👥 Étape 5 : Gestion des Étudiants

### 5.1 Liste des Étudiants "Deprioritized"

Chaque année, l'admin reçoit une liste officielle des étudiants qui ont déjà trouvé un stage.

**Via Dashboard Admin → Étudiants** :
1. Importer la liste (CSV recommandé)
2. Ou chercher manuellement et cocher la case "A déjà un stage"

**Via SQL** :
```sql
-- Marquer un étudiant comme "deprioritized"
UPDATE public.profiles
SET is_deprioritized = true
WHERE email = 'etudiant@example.com' AND role = 'student';

-- En masse depuis une liste d'emails
UPDATE public.profiles
SET is_deprioritized = true
WHERE email IN (
    'student1@school.fr',
    'student2@school.fr',
    -- ...
) AND role = 'student';

-- Vérifier
SELECT email, full_name, is_deprioritized
FROM public.profiles
WHERE role = 'student'
ORDER BY is_deprioritized DESC, email;
```

---

## 🚀 Étape 6 : Ouverture des Réservations

### 6.1 Checklist Pré-Ouverture

- [ ] Tous les créneaux sont générés
- [ ] Toutes les entreprises partenaires sont vérifiées
- [ ] Les flags `is_deprioritized` sont à jour
- [ ] La configuration `event_config` est correcte
- [ ] Tests de booking effectués en staging

### 6.2 Ouvrir la Phase 1

**Via Dashboard Admin** :
1. Aller dans **Admin → Configuration**
2. Cliquer sur **"Ouvrir la Phase 1"**

**Via SQL** :
```sql
UPDATE public.event_config
SET 
    is_booking_open = true,
    current_phase = 1
WHERE id = 1;
```

### 6.3 Passer à la Phase 2

**À la date prévue** (ex: 2 jours avant l'événement) :

```sql
UPDATE public.event_config
SET current_phase = 2
WHERE id = 1;
```

### 6.4 Fermer les Réservations

**La veille de l'événement** (pour éviter les annulations de dernière minute) :

```sql
UPDATE public.event_config
SET is_booking_open = false
WHERE id = 1;
```

---

## 📊 Étape 7 : Monitoring

### 7.1 Dashboard Statistiques

Requête pour afficher les stats en temps réel :

```sql
-- Vue d'ensemble
SELECT * FROM public.dev_system_stats;

-- Taux de remplissage par entreprise
SELECT * FROM public.dev_company_slot_summary;

-- Bookings récents
SELECT 
    p.full_name AS student_name,
    c.name AS company_name,
    es.start_time,
    b.created_at AS booked_at,
    b.booking_phase
FROM public.bookings b
JOIN public.profiles p ON p.id = b.student_id
JOIN public.event_slots es ON es.id = b.slot_id
JOIN public.companies c ON c.id = es.company_id
WHERE b.status = 'confirmed'
ORDER BY b.created_at DESC
LIMIT 50;
```

### 7.2 Alertes à Surveiller

1. **Slots se remplissant trop vite** :
   ```sql
   -- Slots pleins en moins de 5 minutes
   SELECT 
       es.id,
       c.name,
       es.start_time,
       COUNT(b.id) AS bookings
   FROM public.event_slots es
   JOIN public.companies c ON c.id = es.company_id
   JOIN public.bookings b ON b.slot_id = es.id
   WHERE b.status = 'confirmed'
   GROUP BY es.id, c.name, es.start_time
   HAVING COUNT(b.id) = 2
   ORDER BY es.start_time;
   ```

2. **Erreurs de booking fréquentes** :
   ```sql
   SELECT 
       error_code,
       COUNT(*) AS occurrences,
       AVG(response_time_ms) AS avg_response_ms
   FROM public.booking_attempts
   WHERE success = false
   AND attempted_at > NOW() - INTERVAL '1 hour'
   GROUP BY error_code
   ORDER BY occurrences DESC;
   ```

---

## 🐛 Troubleshooting

### Problème : "Les étudiants ne peuvent pas réserver"

**Causes possibles** :
1. `is_booking_open = false` dans `event_config`
2. Aucun slot généré
3. RLS bloque les requêtes

**Solution** :
```sql
-- Vérifier la config
SELECT is_booking_open, current_phase FROM public.event_config;

-- Vérifier les slots
SELECT COUNT(*) FROM public.event_slots WHERE is_active = true;

-- Tester les permissions
SELECT * FROM public.event_slots LIMIT 1;
```

### Problème : "Les slots ne se génèrent pas"

**Causes** :
1. Aucune entreprise vérifiée
2. Problème de dates dans `event_config`

**Solution** :
```sql
-- Vérifier les entreprises
SELECT COUNT(*) FROM public.companies WHERE is_verified = true;

-- Vérifier la config
SELECT event_date, event_start_time, event_end_time 
FROM public.event_config;

-- Forcer la génération
SELECT public.fn_generate_event_slots(
    ARRAY(SELECT id FROM public.companies WHERE is_verified = true),
    '2026-11-19'::DATE  -- Force la date
);
```

### Problème : "Un étudiant deprioritized a réservé en Phase 1"

**Cause** : Flag `is_deprioritized` mal configuré

**Solution** :
```sql
-- Trouver les bookings invalides
SELECT 
    p.email,
    p.is_deprioritized,
    b.booking_phase,
    b.created_at
FROM public.bookings b
JOIN public.profiles p ON p.id = b.student_id
WHERE b.booking_phase = 1 AND p.is_deprioritized = true;

-- Annuler ces bookings si nécessaire
UPDATE public.bookings
SET status = 'cancelled', cancelled_reason = 'Invalid Phase 1 booking'
WHERE id IN (...);
```

---

## 📋 Checklist Complète

### 6 Semaines Avant
- [ ] Exécuter le script de reset SQL
- [ ] Mettre à jour `event_config` avec les nouvelles dates
- [ ] Tester le système de booking en dev

### 4 Semaines Avant
- [ ] Vérifier toutes les entreprises partenaires
- [ ] Demander aux entreprises de créer leurs offres
- [ ] Générer les créneaux
- [ ] Vérifier que les horaires sont corrects

### 2 Semaines Avant
- [ ] Importer la liste des étudiants deprioritized
- [ ] Effectuer un test de charge (script `test-concurrent-bookings.js`)
- [ ] Vérifier les politiques RLS

### 1 Semaine Avant
- [ ] Ouvrir les inscriptions étudiants
- [ ] Communiquer les dates de Phase 1 et Phase 2
- [ ] Monitoring intensif

### Jour J - 1
- [ ] Ouvrir la Phase 1 (`is_booking_open = true`)
- [ ] Surveiller le dashboard en temps réel

### Pendant la Phase 1
- [ ] Monitoring continu
- [ ] Support utilisateurs
- [ ] Refresh de `slot_availability`

### Transition Phase 2
- [ ] Passer `current_phase` à 2
- [ ] Communiquer aux étudiants deprioritized

### Jour J
- [ ] Fermer les réservations (`is_booking_open = false`)
- [ ] Exporter les plannings pour les entreprises
- [ ] Imprimer les badges/plannings si nécessaire

### Après l'Événement
- [ ] Archiver les données
- [ ] Analyser les métriques
- [ ] Retours d'expérience pour l'année prochaine

---

## 📞 Support

En cas de problème critique :
1. Vérifier les logs Supabase (Dashboard → Logs)
2. Consulter `booking_attempts` pour les erreurs
3. Activer le mode debug sur le frontend si nécessaire

**Contacts** :
- Développeur : [email]
- Admin Système : [email]

---

**Dernière mise à jour** : Novembre 2025
