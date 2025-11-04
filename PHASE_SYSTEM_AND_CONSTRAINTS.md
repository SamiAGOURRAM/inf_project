# Système de Phases et Contraintes de Réservation

## 📋 Explication du Système de Phases

### Concept Principal

Le système utilise **2 phases de réservation** pour garantir l'équité entre les étudiants :

#### **Phase 1 - Réservation Prioritaire**
- **Durée** : Définie par `phase1_start` → `phase1_end` dans la table `events`
- **Qui peut réserver** : Étudiants qui n'ont PAS coché "Head Start" à l'inscription
- **Limite** : Maximum 3 entrevues (`phase1_booking_limit`)
- **Objectif** : Donner la priorité aux étudiants français/standards

#### **Phase 2 - Ouverture Générale**
- **Durée** : Définie par `phase2_start` → `phase2_end` dans la table `events`
- **Qui peut réserver** : **TOUS** les étudiants
  - Étudiants "Head Start" peuvent ENFIN réserver
  - Étudiants Phase 1 peuvent augmenter leurs réservations (de 3 à 6)
- **Limite** : Maximum 6 entrevues (`phase2_booking_limit`)
- **Objectif** : Remplir les créneaux restants

### Affichage dans l'Application

**Pour les Étudiants** (`/student/page.tsx`) :
```
Phase actuelle : Phase 1 (Priority) ou Phase 2 (Open to All)
Vos réservations : 2/3 (Phase 1) ou 4/6 (Phase 2)
```

**Pour les Entreprises** (`/company/events/[id]/page.tsx`) :
```
Phase 1 (max) : 3 entrevues
Phase 2 (max) : 6 entrevues
```

---

## ❌ PROBLÈME IDENTIFIÉ : Interface Admin Manquante

### Ce qui manque

**Il n'y a AUCUNE interface admin pour :**
- ✅ Créer un événement avec les phases
- ✅ Définir les dates de Phase 1 et Phase 2
- ✅ Configurer les limites de réservation (3 et 6)
- ✅ **Changer manuellement la phase active** (`current_phase`)

### État Actuel

La gestion des phases se fait uniquement via :
1. **SQL direct** dans la base de données
2. **Migration scripts** (voir `20251101000001_initial_schema.sql`)

### Solution Nécessaire

Créer une interface admin pour gérer :
```
Admin > Events > [Event Details] > Phase Management
- Phase 1 Start: [Date/Time Picker]
- Phase 1 End: [Date/Time Picker]
- Phase 1 Booking Limit: [Number Input - Default: 3]
- Phase 2 Start: [Date/Time Picker]
- Phase 2 End: [Date/Time Picker]
- Phase 2 Booking Limit: [Number Input - Default: 6]
- Current Phase: [Radio: 0=Closed, 1=Phase 1, 2=Phase 2]
```

---

## 🔒 Contraintes de Réservation

### ✅ IMPLÉMENTÉES (dans `fn_book_interview`)

#### 1. **Limite par Phase** ✅
```sql
-- Phase 1: Max 3 réservations
-- Phase 2: Max 6 réservations
v_max_bookings := v_phase = 1 ? 3 : 6
```
**Validation** : Ligne 151-162 de `20251101000011_booking_engine_functions.sql`

#### 2. **Capacité du Créneau** ✅
```sql
-- Vérifier qu'il reste de la place (ex: 2 étudiants max par slot)
IF v_bookings >= v_capacity THEN
    RETURN 'This slot is fully booked';
```
**Validation** : Ligne 141-146 de `fn_book_interview`

#### 3. **Pas de Double Réservation sur Même Créneau** ✅
```sql
-- Un étudiant ne peut pas réserver 2 fois le même créneau
IF EXISTS (
    SELECT 1 FROM interview_bookings
    WHERE student_id = p_student_id AND slot_id = p_slot_id
) THEN
    RETURN 'You already have a booking for this time slot';
```
**Validation** : Ligne 133-139 de `fn_book_interview`

---

### ❌ CONTRAINTES MANQUANTES (À IMPLÉMENTER)

#### 1. **Une Seule Réservation par Entreprise** ❌

**Problème** : Actuellement, un étudiant peut réserver PLUSIEURS créneaux avec la même entreprise.

**Exemple problématique** :
```
Étudiant A :
- 10h00 : Google (Offre: Software Engineer)
- 11h00 : Google (Offre: Data Scientist)
- 14h00 : Google (Offre: Product Manager)
```

**Solution à implémenter** :
```sql
-- Dans fn_book_interview, ajouter cette vérification :
IF EXISTS (
    SELECT 1 
    FROM interview_bookings ib
    JOIN event_slots es ON es.id = ib.slot_id
    WHERE ib.student_id = p_student_id
      AND es.company_id = (SELECT company_id FROM event_slots WHERE id = p_slot_id)
      AND ib.status = 'confirmed'
) THEN
    RETURN QUERY SELECT false, NULL::UUID, 
        'You already have a booking with this company'::TEXT;
    RETURN;
END IF;
```

**Fichier à modifier** : `/supabase/migrations/20251101000011_booking_engine_functions.sql`
**Position** : Après la ligne 139, avant la vérification de capacité

---

#### 2. **Pas de Chevauchement de Créneaux** ❌

**Problème** : Un étudiant peut réserver 2 créneaux qui se chevauchent dans le temps.

**Exemple problématique** :
```
Étudiant A :
- 10h00-10h15 : Google
- 10h10-10h25 : Microsoft  ❌ CONFLIT !
```

**Solution à implémenter** :
```sql
-- Dans fn_book_interview, ajouter cette vérification :
DECLARE
    v_slot_start TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
BEGIN
    -- Récupérer les horaires du créneau sélectionné
    SELECT start_time, end_time INTO v_slot_start, v_slot_end
    FROM event_slots
    WHERE id = p_slot_id;

    -- Vérifier les conflits de temps
    IF EXISTS (
        SELECT 1 
        FROM interview_bookings ib
        JOIN event_slots es ON es.id = ib.slot_id
        WHERE ib.student_id = p_student_id
          AND ib.status = 'confirmed'
          AND (
              -- Chevauchement de créneaux
              (es.start_time < v_slot_end AND es.end_time > v_slot_start)
          )
    ) THEN
        RETURN QUERY SELECT false, NULL::UUID, 
            'You already have a booking at this time. You cannot be in two places at once!'::TEXT;
        RETURN;
    END IF;
END;
```

**Fichier à modifier** : `/supabase/migrations/20251101000011_booking_engine_functions.sql`
**Position** : Après la vérification "une entreprise par étudiant"

---

## 📊 Résumé des Contraintes

| Contrainte | Statut | Emplacement | Priorité |
|------------|--------|-------------|----------|
| Limite Phase 1 (3 max) | ✅ Implémentée | `fn_check_student_booking_limit` | N/A |
| Limite Phase 2 (6 max) | ✅ Implémentée | `fn_check_student_booking_limit` | N/A |
| Capacité du créneau | ✅ Implémentée | `fn_check_slot_availability` | N/A |
| Pas de double réservation même slot | ✅ Implémentée | `fn_book_interview` ligne 133 | N/A |
| **1 entreprise par étudiant** | ❌ **MANQUANTE** | À ajouter dans `fn_book_interview` | 🔴 **HAUTE** |
| **Pas de chevauchement horaire** | ❌ **MANQUANTE** | À ajouter dans `fn_book_interview` | 🔴 **HAUTE** |
| Interface admin phases | ❌ **MANQUANTE** | À créer `/admin/events/[id]/phases` | 🟡 **MOYENNE** |

---

## 🚀 Prochaines Étapes Recommandées

### Priorité 1 : Corriger les Contraintes Critiques
1. **Migration 18** : Ajouter contrainte "1 entreprise par étudiant"
2. **Migration 18** : Ajouter contrainte "pas de chevauchement horaire"
3. Tester avec scénarios edge-case

### Priorité 2 : Interface Admin pour les Phases
1. Créer page `/admin/events/[id]/edit` avec section "Phase Management"
2. Formulaire pour modifier :
   - Dates Phase 1/2
   - Limites de réservation
   - Phase active actuelle
3. Validation côté serveur

### Priorité 3 : Améliorer UX Étudiant
1. Afficher message clair : "Vous avez déjà une entrevue avec cette entreprise"
2. Griser les créneaux en conflit horaire
3. Indicateur visuel : "Créneau en conflit avec [Entreprise] à [Heure]"

---

## 📝 Notes Techniques

### Structure de la Base de Données

```sql
-- Table: events
phase1_start TIMESTAMPTZ NOT NULL
phase1_end TIMESTAMPTZ NOT NULL
phase2_start TIMESTAMPTZ NOT NULL
phase2_end TIMESTAMPTZ NOT NULL
current_phase INTEGER DEFAULT 0 CHECK (current_phase IN (0, 1, 2))
phase1_booking_limit INTEGER DEFAULT 3
phase2_booking_limit INTEGER DEFAULT 6

-- Table: event_slots
start_time TIMESTAMPTZ NOT NULL
end_time TIMESTAMPTZ NOT NULL
capacity INTEGER DEFAULT 2

-- Table: interview_bookings
booking_phase INTEGER CHECK (booking_phase IN (1, 2))
```

### Logique de Détermination de Phase

Actuellement dans `fn_check_student_booking_limit` :
```sql
-- TROP SIMPLISTE !
IF v_event_date <= NOW() THEN
    v_phase := 2;
ELSE
    v_phase := 1;
END IF;
```

**Devrait être** :
```sql
-- Récupérer la phase active de l'événement
SELECT current_phase INTO v_phase
FROM events
WHERE id = p_event_id;
```

---

## 🐛 Bug Potentiel Identifié

**Dans `/supabase/migrations/20251101000011_booking_engine_functions.sql` ligne 70-78** :

La détermination de la phase est basée sur `event_date` et non sur `phase1_start/phase2_start`.

**Impact** : 
- La phase change automatiquement à la date de l'événement
- Ignore complètement `current_phase` dans la table `events`
- Admin ne peut pas contrôler manuellement les phases

**Fix nécessaire** : Utiliser `current_phase` de la table `events` au lieu de calculer basé sur la date.

