# 🧪 Guide de Test Complet - Système de Speed Recruiting

**Date:** 4 Novembre 2025  
**Serveur:** http://localhost:3000  
**Objectif:** Tester l'ensemble du workflow depuis zéro (comme si la plateforme n'avait jamais été utilisée)

---

## 📋 Workflow à Tester

```
Admin Login → Create Event → Configure Phases → Create Sessions 
→ Create Company → Invite Company → Auto-Generate Slots 
→ Company Views Schedule → Create Student → Book Interviews
→ Test Auto-Regeneration → Verify Metrics
```

---

## ✅ Test 1: Admin Login & Dashboard

**URL:** http://localhost:3000/login  
**Objectif:** Vérifier que l'admin peut se connecter et voir un dashboard vide

### Actions:
1. Se connecter avec compte admin
2. Vérifier redirection vers `/admin`
3. Vérifier dashboard affiche:
   - **0 Upcoming Events**
   - **0 Total Companies** (ou nombre existant)
   - **0 Active Sessions**
   - **0 Total Interviews**

### ✅ Résultat attendu:
- Dashboard charge sans erreurs
- Métriques à zéro (sauf companies si elles existent déjà)
- Section "Upcoming Events" vide avec message "No upcoming events"
- Bouton "Manage →" mène à `/admin/events`

---

## ✅ Test 2: Event Creation

**URL:** http://localhost:3000/admin/events  
**Objectif:** Créer un nouvel événement avec le formulaire simplifié

### Actions:
1. Cliquer "Create New Event"
2. Remplir le formulaire:
   - **Event Name:** "Tech Career Fair 2025"
   - **Date:** 2025-12-15
   - **Location:** "Campus Main Hall"
   - **Description:** "Annual tech recruiting event for CS students"
3. Cliquer "Create Event"

### ✅ Résultat attendu:
- Message de succès: "✅ Event created successfully! Now add Sessions to configure interview times."
- Note visible: "📅 Next Steps: After creating the event, you'll configure: Phases, Sessions, Participants"
- Événement apparaît dans la liste
- **Pas de champs** pour interview_duration, buffer, slots_per_time

### 🔍 Vérifications base de données:
```sql
-- Vérifier l'événement créé
SELECT id, name, date, location, description, created_at 
FROM events 
WHERE name = 'Tech Career Fair 2025';
```

---

## ✅ Test 3: Phases Configuration

**URL:** http://localhost:3000/admin/events/[event_id]/phases  
**Objectif:** Configurer Phase 1 et Phase 2 avec booking limits

### Actions:
1. Depuis la liste d'événements, cliquer "⚙️ Configure" → "Phases"
2. Configurer **Phase 1**:
   - Start Date: 2025-11-20
   - End Date: 2025-11-30
   - Max Bookings Per Student: 3
3. Configurer **Phase 2**:
   - Start Date: 2025-12-01
   - End Date: 2025-12-14
   - Max Bookings Per Student: 5
4. Sauvegarder

### ✅ Résultat attendu:
- Phases sauvegardées avec succès
- Affichage clair des deux phases avec dates et limites
- Validation: Phase 2 start > Phase 1 end

### 🔍 Vérifications base de données:
```sql
-- Vérifier les phases configurées dans events
SELECT 
  id,
  name,
  phase1_start_date,
  phase1_end_date,
  phase2_start_date,
  phase2_end_date,
  phase1_max_bookings,
  phase2_max_bookings,
  current_phase
FROM events
WHERE id = '[event_id]';
```

---

## ✅ Test 4: Sessions Creation

**URL:** http://localhost:3000/admin/events/[event_id]/sessions  
**Objectif:** Créer plusieurs sessions avec time ranges et interview duration

### Actions:
1. Cliquer "Add Session"
2. **Session 1 - Morning:**
   - Session Name: "Morning Session"
   - Start Time: 09:00
   - End Time: 12:00
   - Interview Duration: 20 minutes
3. **Session 2 - Afternoon:**
   - Session Name: "Afternoon Session"
   - Start Time: 14:00
   - End Time: 17:00
   - Interview Duration: 20 minutes
4. Sauvegarder les sessions

### ✅ Résultat attendu:
- Sessions créées avec succès
- Liste affiche les 2 sessions avec horaires
- Calcul automatique du nombre de slots: 
  - Morning: 180 min / 20 min = 9 slots
  - Afternoon: 180 min / 20 min = 9 slots
- **PAS de bouton "Regenerate Slots"** (auto-génération)
- Message info: "Slots are auto-generated when companies are invited"

### 🔍 Vérifications base de données:
```sql
-- Vérifier les sessions
SELECT id, name, start_time, end_time, interview_duration_minutes
FROM speed_recruiting_sessions
WHERE event_id = '[event_id]'
ORDER BY start_time;

-- Vérifier qu'aucun slot n'existe encore (pas de companies invitées)
SELECT COUNT(*) as slot_count
FROM event_slots
WHERE event_id = '[event_id]';
-- Devrait retourner 0
```

---

## ✅ Test 5: Company Registration

**URL:** http://localhost:3000/signup  
**Objectif:** Créer un compte entreprise

### Actions:
1. Sélectionner "Company Account"
2. Remplir le formulaire:
   - Email: "hr@techcorp-solutions.com"
   - Password: "TestPass123!"
   - Full Name: "Sarah Johnson"
   - Company Name: "TechCorp Solutions"
   - Industry: "Technology"
   - Website: "https://www.techcorp-solutions.com"
3. S'inscrire
4. Se connecter avec le compte créé

### ✅ Résultat attendu:
- Compte créé avec succès
- Redirection vers `/company`
- Dashboard entreprise affiche:
  - **No events to display** (pas encore invitée)

### 🔍 Vérifications base de données:
```sql
-- Vérifier le compte entreprise
SELECT c.id, c.company_name, c.industry, p.email, p.full_name
FROM companies c
JOIN profiles p ON c.profile_id = p.id
WHERE c.company_name = 'TechCorp Solutions';
```

---

## ✅ Test 6: Participant Invitation & Auto-Generation

**URL:** http://localhost:3000/admin/events/[event_id]/participants  
**Objectif:** Inviter l'entreprise et vérifier l'auto-génération des slots

### Actions (Admin):
1. Aller sur `/admin/events/[event_id]/participants`
2. Cliquer "Invite Company"
3. Sélectionner "TechCorp Solutions"
4. Cliquer "Invite Selected Companies"

### ✅ Résultat attendu:
- Message de succès: "Companies invited successfully! Slots have been auto-generated."
- TechCorp apparaît dans la liste des participants
- **TRIGGER AUTO-GÉNÉRATION**: Slots créés automatiquement

### 🔍 Vérifications base de données:
```sql
-- Vérifier l'invitation
SELECT ep.*, c.company_name
FROM event_participants ep
JOIN companies c ON ep.company_id = c.id
WHERE ep.event_id = '[event_id]';

-- IMPORTANT: Vérifier l'auto-génération des slots
SELECT 
  ses.name as session_name,
  COUNT(evs.id) as slot_count,
  MIN(evs.start_time) as first_slot,
  MAX(evs.end_time) as last_slot
FROM event_slots evs
JOIN speed_recruiting_sessions ses ON evs.session_id = ses.id
WHERE evs.event_id = '[event_id]'
  AND evs.company_id = (SELECT id FROM companies WHERE company_name = 'TechCorp Solutions')
GROUP BY ses.name
ORDER BY MIN(evs.start_time);

-- Devrait montrer:
-- Morning Session: 9 slots (09:00-12:00, 20min intervals)
-- Afternoon Session: 9 slots (14:00-17:00, 20min intervals)
-- TOTAL: 18 slots pour TechCorp
```

### 🎯 Test du Trigger:
Ce test vérifie que le trigger `auto_generate_slots_on_company_invite` fonctionne :
- ✅ Détecte l'insertion dans `event_participants`
- ✅ Récupère toutes les sessions de l'événement
- ✅ Génère automatiquement les slots pour chaque session
- ✅ Log visible dans les logs Supabase

---

## ✅ Test 7: Company Schedule View

**URL:** http://localhost:3000/company/schedule  
**Objectif:** Entreprise voit ses slots groupés par session

### Actions (Company - TechCorp):
1. Se connecter avec hr@techcorp-solutions.com
2. Aller sur `/company/schedule`

### ✅ Résultat attendu:
- **Event:** "Tech Career Fair 2025"
- **Location:** "Campus Main Hall"
- Slots groupés par session:

```
📅 Morning Session
🕒 09:00 - 12:00
  - 09:00 - 09:20 [Available]
  - 09:20 - 09:40 [Available]
  - 09:40 - 10:00 [Available]
  ... (9 slots total)

📅 Afternoon Session
🕒 14:00 - 17:00
  - 14:00 - 14:20 [Available]
  - 14:20 - 14:40 [Available]
  ... (9 slots total)
```

- Badge de statut pour chaque slot
- Affichage hiérarchique: Session → Slots → Bookings

---

## ✅ Test 8: Student Registration & Booking

**URL:** http://localhost:3000/signup  
**Objectif:** Créer un étudiant et réserver des interviews

### Actions:
1. Créer compte étudiant:
   - Email: "john.doe@student.edu"
   - Full Name: "John Doe"
   - Major: "Computer Science"
   - Graduation Year: 2026
2. TechCorp crée une offre d'emploi (sur `/company/offers`)
3. Étudiant consulte les offres (`/student/offers`)
4. Étudiant réserve un interview (Phase 1: max 3 bookings)

### ✅ Résultat attendu:
- Étudiant peut voir les offres de TechCorp
- Interface de booking affiche les sessions
- Respect des limites de phase
- Slot marqué comme "Booked" après réservation

### 🔍 Vérifications:
```sql
-- Vérifier le booking
SELECT 
  ib.id,
  p.full_name as student_name,
  c.company_name,
  ses.name as session_name,
  evs.start_time,
  evs.end_time,
  ib.status
FROM interview_bookings ib
JOIN profiles p ON ib.student_id = p.id
JOIN event_slots evs ON ib.slot_id = evs.id
JOIN companies c ON evs.company_id = c.id
JOIN speed_recruiting_sessions ses ON evs.session_id = ses.id
WHERE p.email = 'john.doe@student.edu';
```

---

## ✅ Test 9: Auto-Regeneration on Session Update

**URL:** http://localhost:3000/admin/events/[event_id]/sessions  
**Objectif:** Modifier une session et vérifier la régénération automatique

### Actions (Admin):
1. Éditer "Morning Session"
2. Changer:
   - End Time: 11:00 (au lieu de 12:00)
   - Interview Duration: 15 minutes (au lieu de 20)
3. Sauvegarder

### ✅ Résultat attendu:
- **TRIGGER AUTO-RÉGÉNÉRATION**: 
  - Anciens slots Morning (9 slots de 20min) **SUPPRIMÉS**
  - Nouveaux slots Morning (8 slots de 15min) **CRÉÉS**
  - Slots Afternoon **INCHANGÉS**

### 🔍 Vérifications:
```sql
-- Vérifier les nouveaux slots Morning
SELECT 
  start_time, 
  end_time,
  EXTRACT(EPOCH FROM (end_time - start_time))/60 as duration_minutes
FROM event_slots
WHERE session_id = (
  SELECT id FROM speed_recruiting_sessions 
  WHERE name = 'Morning Session' AND event_id = '[event_id]'
)
ORDER BY start_time;

-- Devrait montrer:
-- 09:00-09:15, 09:15-09:30, 09:30-09:45, ... jusqu'à 11:00
-- Total: 8 slots de 15 minutes
```

### 🎯 Test du Trigger:
Vérifie que `auto_regenerate_slots_on_session_update` fonctionne :
- ✅ Détecte les changements de start_time/end_time/interview_duration
- ✅ Supprime les anciens slots
- ✅ Régénère les nouveaux slots
- ✅ Préserve les slots des autres sessions

---

## ✅ Test 10: Dashboard Metrics Update

**URL:** http://localhost:3000/admin  
**Objectif:** Vérifier que toutes les métriques sont correctes

### ✅ Résultat attendu:
- **1 Upcoming Event** ("Tech Career Fair 2025")
- **1 Total Company** (TechCorp Solutions)
- **1 Total Participant** (TechCorp invitée)
- **2 Active Sessions** (Morning + Afternoon)
- **N Total Interviews** (nombre de bookings effectués)

### Section "Upcoming Events":
```
Tech Career Fair 2025
📍 Campus Main Hall
December 15, 2025

Participants: 1
Sessions: 2
Interviews: X booked / Y total
```

---

## 🎯 Checklist Finale

- [ ] Admin peut créer événements avec 4 champs seulement
- [ ] Phases configurées avec booking limits
- [ ] Sessions créées avec time ranges et interview duration
- [ ] **Auto-génération** quand company invitée
- [ ] Company voit slots groupés par session
- [ ] Slots affichent les plages horaires correctes
- [ ] **Auto-régénération** quand session modifiée
- [ ] Bookings étudiants respectent les phases
- [ ] Dashboard affiche métriques correctes
- [ ] Pas de boutons "Regenerate" manuels
- [ ] Pas de workflow approval (verification/registration)

---

## 🐛 Problèmes Potentiels à Surveiller

1. **Triggers ne s'exécutent pas**
   - Vérifier que les migrations 20 & 21 sont appliquées
   - Vérifier les logs Supabase pour les RAISE NOTICE

2. **Slots dupliqués**
   - Vérifier que l'auto-régénération supprime les anciens slots

3. **Sessions non affichées**
   - Vérifier les queries dans company/schedule

4. **Phases non respectées**
   - Vérifier la logique de booking limits

---

## 📊 Queries Utiles pour Debug

```sql
-- État complet d'un événement
SELECT 
  e.name as event_name,
  (SELECT COUNT(*) FROM speed_recruiting_sessions WHERE event_id = e.id) as sessions,
  (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participants,
  (SELECT COUNT(*) FROM event_slots WHERE event_id = e.id) as total_slots,
  (SELECT COUNT(*) FROM interview_bookings ib 
   JOIN event_slots es ON ib.slot_id = es.id 
   WHERE es.event_id = e.id) as bookings
FROM events e
WHERE e.id = '[event_id]';

-- Vérifier les triggers actifs
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%auto%';
```

---

**🚀 Prêt pour les tests !**
