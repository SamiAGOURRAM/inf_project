# INF Platform 2.0 - Architecture & Implementation Guide

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Schéma de base de données amélioré](#schéma-de-base-de-données)
4. [Stratégies de résilience](#stratégies-de-résilience)
5. [Plan d'implémentation 2 semaines](#plan-dimplémentation)
6. [Maintenance annuelle](#maintenance-annuelle)

---

## 🎯 Vue d'ensemble

### Problème résolu
Système de réservation équitable pour speed-recruiting avec :
- **Fairness** : système de phases pour éviter le FIFO sauvage
- **Scalabilité** : gestion des concurrences et montées en charge
- **Réutilisabilité** : configuration annuelle sans code

### Principes de conception
1. **Data-driven configuration** : Tout est paramétrable en DB
2. **Atomic operations** : Transactions ACID pour l'intégrité
3. **Optimistic UI** : Feedback immédiat, validation asynchrone
4. **Audit trail** : Traçabilité complète des actions
5. **Fail-safe** : Dégradation gracieuse en cas d'erreur

---

## 🏗️ Architecture Technique

### Stack
```
┌─────────────────────────────────────────────────────┐
│                   Vercel Edge Network                │
│                   (CDN + Caching)                    │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              Next.js 14 App Router                   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Pages:                                      │   │
│  │  • /auth/signup (student/company)           │   │
│  │  • /student/offers (browse & filter)        │   │
│  │  • /student/schedule (my bookings)          │   │
│  │  • /company/dashboard (my slots)            │   │
│  │  • /admin/dashboard (system control)        │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Components: shadcn/ui + custom             │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                 Supabase Platform                    │
│  ┌──────────────────┬──────────────────┬─────────┐ │
│  │  Auth (JWT)      │  Postgres 15     │ Storage │ │
│  │  • Email/Pass    │  • RLS Policies  │ • Logos │ │
│  │  • Row Level     │  • Functions     │ • CVs   │ │
│  │    Security      │  • Triggers      │         │ │
│  └──────────────────┴──────────────────┴─────────┘ │
└─────────────────────────────────────────────────────┘
```

### Flux de données critiques

#### 1. Booking Flow (avec gestion de concurrence)
```
User clicks "Book"
    ↓
[Client] Optimistic update (show "Booking..." state)
    ↓
[Client] Call RPC: fn_book_interview(slot_id)
    ↓
[Supabase] Start transaction
    ↓
[Postgres] Lock event_slot row (SELECT ... FOR UPDATE)
    ↓
[Postgres] Check all constraints:
    • Phase gate (is_deprioritized)
    • Phase cap (max 3 in Phase 1)
    • Total cap (max 6 total)
    • Slot capacity (max 2 students)
    ↓
[Postgres] Insert into bookings OR Return error
    ↓
[Postgres] Commit transaction
    ↓
[Client] Update UI based on result
```

#### 2. Admin Slot Generation Flow
```
Admin inputs:
    • Event date
    • Start time (e.g., 09:00)
    • End time (e.g., 13:00)
    • Selected company IDs
    ↓
[Client] Call RPC: fn_generate_event_slots(params)
    ↓
[Postgres] Read event_config:
    • slot_duration (10 min)
    • buffer_duration (5 min)
    ↓
[Postgres] FOR EACH company:
    • Calculate time slots (09:00-09:10, 09:15-09:25, ...)
    • INSERT INTO event_slots
    ↓
[Postgres] Return total slots created
```

---

## 🗄️ Schéma de Base de Données

### Améliorations par rapport au cahier initial

#### 1. Nouvelle table : `event_config`
**Pourquoi ?** Centraliser toute la configuration pour réutilisation annuelle.

```sql
CREATE TABLE event_config (
    id INT PRIMARY KEY DEFAULT 1,
    event_name TEXT NOT NULL DEFAULT 'INF 2025',
    event_date DATE NOT NULL,
    
    -- Slot configuration
    slot_duration_minutes INT NOT NULL DEFAULT 10,
    buffer_duration_minutes INT NOT NULL DEFAULT 5,
    slot_capacity INT NOT NULL DEFAULT 2,
    
    -- Event window
    event_start_time TIME NOT NULL DEFAULT '09:00:00',
    event_end_time TIME NOT NULL DEFAULT '13:00:00',
    
    -- Phase configuration
    phase_1_start TIMESTAMPTZ,
    phase_1_end TIMESTAMPTZ,
    phase_2_start TIMESTAMPTZ,
    phase_2_end TIMESTAMPTZ,
    
    -- Booking limits
    max_bookings_phase_1 INT NOT NULL DEFAULT 3,
    max_bookings_total INT NOT NULL DEFAULT 6,
    
    -- System state
    is_booking_open BOOLEAN NOT NULL DEFAULT false,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT single_config_row CHECK (id = 1)
);
```

#### 2. Table améliorée : `bookings`
**Ajouts** : Audit trail + statuts + index

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES event_slots(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- État du booking
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    
    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    
    -- Metadata
    booking_phase INT NOT NULL, -- 1 or 2 (captured at booking time)
    ip_address INET, -- Optional: for fraud detection
    
    UNIQUE(slot_id, student_id), -- Un étudiant ne peut pas booker 2 fois le même slot
    
    -- Index pour performance
    CREATE INDEX idx_bookings_student ON bookings(student_id) WHERE status = 'confirmed',
    CREATE INDEX idx_bookings_slot ON bookings(slot_id) WHERE status = 'confirmed'
);
```

#### 3. Nouvelle table : `booking_attempts`
**Pourquoi ?** Debugging + analytics + détection d'abus.

```sql
CREATE TABLE booking_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    slot_id UUID NOT NULL REFERENCES event_slots(id),
    
    success BOOLEAN NOT NULL,
    error_code TEXT, -- 'phase_gate', 'phase_cap', 'total_cap', 'slot_full', etc.
    error_message TEXT,
    
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_time_ms INT -- Performance monitoring
);
```

#### 4. Table améliorée : `profiles`
**Ajouts** : Timestamps + metadata

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'company', 'admin')),
    
    -- Student-specific
    is_deprioritized BOOLEAN NOT NULL DEFAULT false,
    cv_url TEXT, -- Supabase Storage URL
    phone TEXT,
    
    -- Company-specific
    company_id UUID REFERENCES companies(id),
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);
```

### Schéma complet avec relations

```
┌──────────────────┐
│   auth.users     │ (Supabase built-in)
└────────┬─────────┘
         │ 1
         │
         │ 1
┌────────▼─────────┐
│    profiles      │
│ ┌──────────────┐ │
│ │ role         │ │──────┐
│ │ is_depriori  │ │      │
│ │ company_id   │ │──┐   │
│ └──────────────┘ │  │   │
└──────────────────┘  │   │
                      │   │
         ┌────────────┘   │
         │ *              │ *
┌────────▼─────────┐      │
│    companies     │      │
│ ┌──────────────┐ │      │
│ │ name         │ │      │
│ │ is_verified  │ │      │
│ └──────────────┘ │      │
└────────┬─────────┘      │
         │ 1              │
         │                │
         │ *              │
┌────────▼─────────┐      │
│     offers       │      │
│ ┌──────────────┐ │      │
│ │ interest_tag │ │      │
│ └──────────────┘ │      │
└──────────────────┘      │
                          │
         ┌────────────────┘
         │ *
┌────────▼─────────┐
│   event_slots    │
│ ┌──────────────┐ │
│ │ start_time   │ │
│ │ capacity=2   │ │
│ └──────────────┘ │
└────────┬─────────┘
         │ 1
         │
         │ *
┌────────▼─────────┐
│    bookings      │
│ ┌──────────────┐ │
│ │ student_id   │ │
│ │ status       │ │
│ │ phase        │ │
│ └──────────────┘ │
└──────────────────┘
```

---

## 🛡️ Stratégies de Résilience

### 1. Gestion de la concurrence (Race Conditions)

#### Problème
À l'ouverture de Phase 1, 500 étudiants cliquent sur le même slot qui a 2 places libres.

#### Solution : Row-level locking + Optimistic UI

**Côté serveur (Postgres Function) :**
```sql
-- Lock pessimiste sur la ligne du slot
SELECT count(*) INTO slot_current_bookings 
FROM bookings 
WHERE slot_id = slot_id_to_book AND status = 'confirmed'
FOR UPDATE OF event_slots; -- Lock la ligne event_slots

-- Si pas encore plein, on insère
IF slot_current_bookings < 2 THEN
    INSERT INTO bookings (slot_id, student_id, booking_phase)
    VALUES (slot_id_to_book, current_student_id, current_phase);
END IF;
```

**Côté client (React) :**
```typescript
const [optimisticBooking, setOptimisticBooking] = useState(null);

async function handleBook(slotId: string) {
  // 1. Optimistic update
  setOptimisticBooking({ slotId, status: 'pending' });
  
  try {
    // 2. Appel API
    const { data, error } = await supabase.rpc('fn_book_interview', { 
      slot_id_to_book: slotId 
    });
    
    if (error) throw error;
    
    // 3. Success
    setOptimisticBooking({ slotId, status: 'confirmed' });
    toast.success(data.message);
    
  } catch (error) {
    // 4. Rollback
    setOptimisticBooking(null);
    toast.error(error.message);
  }
}
```

### 2. Scalabilité (Montée en charge)

#### Optimisations Postgres

**Index critiques :**
```sql
-- Pour les requêtes "combien de bookings a cet étudiant ?"
CREATE INDEX idx_bookings_student_active 
ON bookings(student_id) 
WHERE status = 'confirmed';

-- Pour les requêtes "ce slot est-il plein ?"
CREATE INDEX idx_bookings_slot_active 
ON bookings(slot_id) 
WHERE status = 'confirmed';

-- Pour les requêtes "slots disponibles pour cette entreprise"
CREATE INDEX idx_event_slots_company 
ON event_slots(company_id, start_time);
```

**View matérialisée pour stats :**
```sql
CREATE MATERIALIZED VIEW slot_availability AS
SELECT 
    es.id AS slot_id,
    es.company_id,
    es.start_time,
    es.end_time,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed') AS current_bookings,
    es.capacity - COUNT(b.id) FILTER (WHERE b.status = 'confirmed') AS available_spots,
    CASE 
        WHEN COUNT(b.id) >= es.capacity THEN 'full'
        ELSE 'available'
    END AS status
FROM event_slots es
LEFT JOIN bookings b ON b.slot_id = es.id
GROUP BY es.id;

-- Refresh toutes les 30 secondes
CREATE UNIQUE INDEX ON slot_availability (slot_id);
```

**Côté client : SWR/React Query pour caching :**
```typescript
import useSWR from 'swr';

function useAvailableSlots(companyId: string) {
  return useSWR(
    ['slots', companyId],
    () => fetchSlots(companyId),
    { 
      refreshInterval: 5000, // Refresh toutes les 5s
      revalidateOnFocus: true,
      dedupingInterval: 2000 // Évite les requêtes dupliquées
    }
  );
}
```

### 3. Gestion des erreurs et retry

**Stratégie de retry exponentielle :**
```typescript
async function bookWithRetry(slotId: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await supabase.rpc('fn_book_interview', { slot_id_to_book: slotId });
    } catch (error) {
      if (error.code === 'SLOT_FULL' || error.code === 'PHASE_CAP') {
        // Erreurs définitives, pas de retry
        throw error;
      }
      
      if (attempt === maxRetries - 1) throw error;
      
      // Exponential backoff : 100ms, 200ms, 400ms
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }
  }
}
```

---

## 📅 Plan d'Implémentation (2 semaines)

### Semaine 1 : Fondations

#### Jour 1-2 : Setup & Database
- [ ] Créer projet Supabase
- [ ] Exécuter migrations SQL (tables + fonctions + RLS)
- [ ] Configurer Supabase Auth
- [ ] Setup Next.js 14 + TypeScript + Tailwind
- [ ] Installer shadcn/ui et composants de base

#### Jour 3-4 : Auth & Admin Core
- [ ] Système d'authentification (signup/login)
- [ ] Gestion du flag `is_deprioritized` au signup
- [ ] Dashboard admin : vérification des entreprises
- [ ] Dashboard admin : gestion de `event_config`

#### Jour 5 : Slot Generation
- [ ] Fonction `fn_generate_event_slots`
- [ ] Interface admin pour générer les slots
- [ ] Tests de génération (vérifier 10min + 5min buffer)

### Semaine 2 : Features & Polish

#### Jour 6-7 : Student Flow
- [ ] Page Browse Offers (galerie + filtres)
- [ ] Page Company Detail (infos + slots)
- [ ] Fonction `fn_book_interview` (avec tous les checks)
- [ ] Interface de booking avec feedback

#### Jour 8-9 : Schedules & Company Flow
- [ ] Student : "My Schedule" page
- [ ] Student : Cancel booking
- [ ] Company : Dashboard avec leurs slots réservés
- [ ] Company : Gestion des offres

#### Jour 10-12 : Testing & Optimization
- [ ] Tests de concurrence (script de booking simultané)
- [ ] Optimisation des index
- [ ] Tests E2E critiques (signup → book → schedule)
- [ ] Polish UI/UX

#### Jour 13-14 : Déploiement & Documentation
- [ ] Déploiement Vercel
- [ ] Guide admin (comment setup l'événement)
- [ ] Guide de maintenance annuelle
- [ ] Tests en production

---

## 🔄 Maintenance Annuelle

### Checklist pour INF 2026

**1 mois avant l'événement :**

1. **Reset de la base de données**
   ```sql
   -- Script de reset (à exécuter via Supabase SQL Editor)
   -- ⚠️ ATTENTION : Supprime toutes les données de l'année précédente
   
   -- 1. Sauvegarder les données (optionnel)
   CREATE TABLE archive_bookings_2025 AS SELECT * FROM bookings;
   CREATE TABLE archive_event_slots_2025 AS SELECT * FROM event_slots;
   
   -- 2. Nettoyer
   DELETE FROM bookings;
   DELETE FROM event_slots;
   DELETE FROM offers;
   UPDATE companies SET is_verified = false; -- Ré-vérification annuelle
   UPDATE profiles SET is_deprioritized = false WHERE role = 'student';
   
   -- 3. Mettre à jour la config
   UPDATE event_config SET
       event_name = 'INF 2026',
       event_date = '2026-11-XX', -- À ajuster
       is_booking_open = false,
       phase_1_start = NULL,
       phase_1_end = NULL,
       phase_2_start = NULL,
       phase_2_end = NULL;
   ```

2. **Configuration de l'événement** (via Admin Dashboard)
   - Définir la date de l'événement
   - Définir les horaires (start/end time)
   - Configurer les phases (dates de début/fin)
   - Ajuster les limites de booking si nécessaire

3. **Gestion des utilisateurs**
   - Vérifier les nouvelles entreprises partenaires
   - Importer/mettre à jour la liste des étudiants "deprioritized"
   - Nettoyer les anciens comptes (optionnel)

4. **Tests avant ouverture**
   - Tester le flow complet (signup → book → schedule)
   - Vérifier les règles de fairness (Phase 1 gate)
   - Test de charge (simuler 100+ bookings simultanés)

**Le jour J :**
- Ouvrir les bookings (toggle `is_booking_open = true`)
- Monitorer en temps réel via Admin Dashboard
- Logs des erreurs dans Supabase Dashboard

**Après l'événement :**
- Archiver les données
- Analyser les métriques (taux de remplissage, distribution, etc.)
- Améliorer pour l'année suivante

---

## 🔧 Outils & Scripts Utiles

### Script de test de concurrence (Node.js)
```javascript
// test-concurrent-bookings.js
// Simule 100 utilisateurs qui essaient de booker le même slot

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function simulateConcurrentBookings(slotId, numUsers = 100) {
  const promises = [];
  
  for (let i = 0; i < numUsers; i++) {
    // Simuler différents utilisateurs (avec différents tokens)
    promises.push(
      supabase.rpc('fn_book_interview', { slot_id_to_book: slotId })
    );
  }
  
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.data?.success);
  const failed = results.filter(r => r.status === 'rejected' || !r.value.data?.success);
  
  console.log(`✅ Successful bookings: ${successful.length}`);
  console.log(`❌ Failed bookings: ${failed.length}`);
  console.log(`Expected: Max 2 successful (slot capacity)`);
}
```

### Monitoring Query (Postgres)
```sql
-- Vue en temps réel de l'état du système
SELECT 
    ec.event_name,
    ec.current_phase,
    COUNT(DISTINCT b.student_id) AS unique_students_booked,
    COUNT(b.id) AS total_bookings,
    COUNT(es.id) AS total_slots,
    ROUND(COUNT(b.id)::NUMERIC / (COUNT(es.id) * 2) * 100, 2) AS fill_rate_percent
FROM event_config ec
CROSS JOIN event_slots es
LEFT JOIN bookings b ON b.slot_id = es.id AND b.status = 'confirmed'
GROUP BY ec.id;
```

---

## 📚 Ressources & Documentation

### Documentation technique
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Postgres Transactions & Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)

### Bonnes pratiques
- Toujours utiliser des transactions pour les opérations critiques
- Logger toutes les tentatives de booking (debugging)
- Utiliser des types TypeScript générés depuis Supabase
- Implémenter un système de feature flags (pour rollback rapide)

---

**Version:** 1.0
**Dernière mise à jour:** Novembre 2025
**Auteur:** Architecture pour INF Platform 2.0
