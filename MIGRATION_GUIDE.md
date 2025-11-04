# Guide d'Application des Migrations

## ⚠️ Important
Appliquez les migrations **dans l'ordre** via le SQL Editor de Supabase.

## Ordre d'Application

### ✅ Migrations de Base (Déjà appliquées)
1. `20251101000001_initial_schema.sql` - Schéma initial
2. `20251101000002_core_functions.sql` - Fonctions de base
3. `20251101000003_seed_data.sql` - Données de test
4. `20251101000004_email_validation.sql` - Validation email
5. `20251101000005_company_head_start.sql` - Configuration entreprise
6. `20251101000006_auto_create_profiles.sql` - Auto-création profils

### 🆕 Nouvelles Migrations (À appliquer)

#### Migration 7: Table Events
**Fichier:** `20251101000007_create_events_table.sql`

**Objectif:** Créer la table `events` pour gérer les événements de recrutement

**Contenu:**
- Table `events` avec colonnes: id, name, description, date, location, is_active
- Index pour la performance
- Politiques RLS (Row Level Security)
- Modification de `event_slots` pour référencer `events`

**À appliquer dans:** SQL Editor

---

#### Migration 7b: Table Interview Bookings
**Fichier:** `20251101000007b_add_interview_bookings.sql`

**Objectif:** Créer la table `interview_bookings` (connexion étudiants-slots-offres)

**Contenu:**
- Table `interview_bookings` avec colonnes: student_id, slot_id, offer_id, status, notes
- Index pour student_id, slot_id, offer_id, status
- Politiques RLS pour étudiants, entreprises, et admins
- Contrainte unique par étudiant/slot

**À appliquer dans:** SQL Editor

---

#### Migration 8: Système Dynamique de Slots
**Fichier:** `20251101000008_enhanced_event_slots.sql`

**Objectif:** Activer la génération dynamique de créneaux horaires

**Contenu:**
- Ajout de colonnes à `events`: interview_duration_minutes, buffer_minutes, slots_per_time
- Nouvelle table `event_time_ranges` pour les plages horaires multiples
- **6 Fonctions PostgreSQL:**
  - `fn_generate_event_slots()` - Génère les créneaux automatiquement
  - `fn_add_event_time_range()` - Ajoute une plage horaire
  - `fn_delete_event_time_range()` - Supprime une plage
  - `fn_get_event_analytics()` - Analytiques événements
  - `fn_get_company_analytics()` - Analytiques entreprises
  - `fn_get_student_analytics()` - Analytiques étudiants

**Fonctionnalités:**
- Plusieurs plages horaires par jour (ex: 9h-10h, 14h-16h)
- Configuration: durée interview + buffer + capacité
- Génération automatique de créneaux
- Toutes les analytiques calculées en base de données

**À appliquer dans:** SQL Editor

---

#### Migration 9: Vérification des Entreprises
**Fichier:** `20251101000009_verify_company_function.sql`

**Objectif:** Permettre aux admins de vérifier/rejeter les entreprises

**Contenu:**
- Fonction `fn_verify_company(company_id, is_verified)`
- Mise à jour automatique de `verification_status`, `verified_by`, `verified_at`
- Protection: seuls les admins peuvent exécuter
- Gestion des erreurs si entreprise introuvable

**À appliquer dans:** SQL Editor

---

#### Migration 10: Champ Department
**Fichier:** `20251101000010_add_department_to_offers.sql`

**Objectif:** Ajouter catégorisation par département aux offres

**Contenu:**
- Colonne `department` à la table `offers`
- Index pour filtrage rapide
- Options: Rooms Division, F&B, HR, IT, Marketing, Finance, etc.

**À appliquer dans:** SQL Editor

---

## 📋 Checklist d'Application

```
[ ] 1. Ouvrir Supabase Dashboard
[ ] 2. Aller dans "SQL Editor"
[ ] 3. Copier le contenu de 20251101000007_create_events_table.sql
[ ] 4. Exécuter → Vérifier "Success"
[ ] 5. Copier le contenu de 20251101000007b_add_interview_bookings.sql
[ ] 6. Exécuter → Vérifier "Success"
[ ] 7. Copier le contenu de 20251101000008_enhanced_event_slots.sql
[ ] 8. Exécuter → Vérifier "Success"
[ ] 9. Copier le contenu de 20251101000009_verify_company_function.sql
[ ] 10. Exécuter → Vérifier "Success"
[ ] 11. Copier le contenu de 20251101000010_add_department_to_offers.sql
[ ] 12. Exécuter → Vérifier "Success"
```

## 🧪 Tests Après Migration

### Test 1: Vérifier la table events
```sql
SELECT * FROM events LIMIT 5;
```

### Test 2: Vérifier interview_bookings
```sql
SELECT * FROM interview_bookings LIMIT 5;
```

### Test 3: Tester la fonction de génération de slots
```sql
-- Créer un événement test
INSERT INTO events (name, date, interview_duration_minutes, buffer_minutes, slots_per_time)
VALUES ('Test Event', NOW() + INTERVAL '7 days', 20, 5, 2)
RETURNING id;

-- Ajouter une plage horaire (remplacer <event_id>)
SELECT fn_add_event_time_range(
    '<event_id>'::UUID,
    (CURRENT_DATE + 7)::DATE,
    '09:00:00'::TIME,
    '12:00:00'::TIME
);

-- Vérifier les slots générés
SELECT * FROM event_slots WHERE event_id = '<event_id>';
```

### Test 4: Tester les analytiques
```sql
-- Analytics événements
SELECT * FROM fn_get_event_analytics();

-- Analytics entreprises
SELECT * FROM fn_get_company_analytics();

-- Analytics étudiants
SELECT * FROM fn_get_student_analytics();
```

### Test 5: Tester la vérification d'entreprise
```sql
-- Lister les entreprises en attente
SELECT id, company_name, verification_status FROM companies;

-- Vérifier une entreprise (remplacer <company_id>)
SELECT fn_verify_company('<company_id>'::UUID, true);

-- Vérifier le statut
SELECT company_name, verification_status, verified_at FROM companies WHERE id = '<company_id>';
```

## ⚠️ En Cas d'Erreur

### Erreur: "relation already exists"
- La migration a déjà été appliquée partiellement
- Vérifier avec: `\dt events` (dans psql) ou Dashboard > Tables
- Si la table existe, passer à la migration suivante

### Erreur: "function already exists"
- Supprimer la fonction existante: `DROP FUNCTION IF EXISTS fn_name(args);`
- Réexécuter la migration

### Erreur: "column already exists"
- La colonne a déjà été ajoutée
- Vérifier avec: `SELECT * FROM information_schema.columns WHERE table_name = 'table_name';`
- Commenter la ligne `ALTER TABLE ADD COLUMN` et réexécuter

## 🎯 Après Toutes les Migrations

Votre système aura:
✅ Gestion complète des événements
✅ Génération dynamique de créneaux horaires
✅ Multiples plages par jour (ex: 9h-10h, 14h-16h)
✅ Configuration: durée + buffer + capacité
✅ Vérification des entreprises par admin
✅ Analytiques calculées en base de données
✅ Catégorisation par département

## 🚀 Prochaines Étapes

Après les migrations:
1. Tester le dashboard admin (`/admin`)
2. Créer un événement de test
3. Ajouter des plages horaires
4. Vérifier les slots générés
5. Tester la vérification d'entreprises
6. Vérifier les analytiques

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifier les logs Supabase (Dashboard > Logs)
2. Vérifier les messages d'erreur exacts
3. Consulter la documentation Supabase
