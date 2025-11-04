# 🚀 Guide de Démarrage Rapide - INF Platform

## 📋 Objectif

Ce guide vous permettra de comprendre rapidement le projet et de commencer à travailler dessus en **moins de 30 minutes**.

---

## 🎯 Comprendre le Projet en 5 Minutes

### Qu'est-ce que c'est ?
Un **système de gestion de speed recruiting** pour l'événement annuel INF qui permet :
- Aux **entreprises** de proposer des offres de stage
- Aux **étudiants** de réserver des créneaux d'entretien
- Aux **admins** de gérer l'événement et garantir l'équité

### Le Problème Résolu
**Ancien système** : Premier arrivé, premier servi → Ruée, frustration, inéquité

**Nouveau système** :
- **Phase 1** (48h) : Étudiants **sans stage** peuvent réserver max **3 entretiens**
- **Phase 2** : **Tous** les étudiants peuvent réserver max **6 entretiens**
- Validations backend garantissent zéro contournement

---

## 📊 État Actuel du Projet

### ✅ Ce qui est FAIT (90%)

**Backend (100%)**
- ✅ 25 migrations SQL appliquées
- ✅ 15+ fonctions PostgreSQL opérationnelles
- ✅ Row Level Security (RLS) complet
- ✅ Système de phases implémenté
- ✅ Moteur de réservation atomique
- ✅ Système d'invitation rapide

**Frontend (90%)**
- ✅ Dashboard Admin (analytics, événements, vérification)
- ✅ Dashboard Entreprise (offres, créneaux, planning)
- ✅ Dashboard Étudiant (offres, réservations, profil)
- ✅ Pages publiques (login, signup, offres)
- ⚠️ Quelques pages à affiner (UI/UX polish)

**Documentation (100%)**
- ✅ Architecture complète
- ✅ Guides utilisateur
- ✅ Scripts de test
- ✅ Diagrammes de flux

### ⚠️ Ce qu'il reste à faire (10%)

**Court Terme**
- [ ] Affiner UI/UX de certaines pages
- [ ] Tester le flow complet end-to-end
- [ ] Personnaliser templates email Supabase
- [ ] Ajouter gestion d'erreurs avancée

**Moyen Terme**
- [ ] Tests E2E automatisés (Playwright/Cypress)
- [ ] Monitoring production (Sentry)
- [ ] Notifications email/push
- [ ] Analytics avancées avec graphiques

---

## 🗂️ Structure du Projet

```
/workspaces/inf_project/
│
├── 📁 frontend/              # Application Next.js
│   ├── app/
│   │   ├── admin/           # Dashboard admin
│   │   ├── company/         # Dashboard entreprise
│   │   ├── student/         # Dashboard étudiant
│   │   ├── login/           # Authentification
│   │   └── signup/          # Inscription
│   ├── lib/                 # Utilitaires (Supabase client)
│   └── types/               # Types TypeScript
│
├── 📁 supabase/
│   └── migrations/          # 25 migrations SQL (numérotées)
│
├── 📁 scripts/              # Scripts utiles
│   ├── test_concurrent_bookings.py
│   ├── check_database_state.sql
│   └── reset_database.sql
│
├── 📁 docs/                 # Documentation utilisateur
│   ├── ADMIN_GUIDE.md
│   └── YEARLY_RESET.md
│
└── 📄 Documentation Principale
    ├── README.md                    # Vue d'ensemble
    ├── PROJECT_ANALYSIS.md          # ✨ ANALYSE COMPLÈTE (ce doc)
    ├── PROJECT_ARCHITECTURE.md      # Architecture technique
    ├── SYSTEM_FLOWS.md              # Diagrammes de flux
    ├── IMPLEMENTATION_GUIDE.md      # Plan implémentation
    └── FINAL_SUMMARY.md             # Récapitulatif final
```

---

## 📚 Documents à Lire (Dans l'ordre)

### 🚀 Pour Démarrer (15 min)
1. **`PROJECT_ANALYSIS.md`** (CE FICHIER)
   - Vue complète du projet
   - État actuel
   - Architecture
   
2. **`SYSTEM_FLOWS.md`**
   - Diagrammes visuels des flux principaux
   - Comprendre comment tout fonctionne

3. **`PROJECT_OVERVIEW.txt`**
   - Résumé ASCII artistique
   - Vue d'ensemble rapide

### 🔧 Pour Développer (1-2h)
4. **`PROJECT_ARCHITECTURE.md`**
   - Architecture technique détaillée
   - Schéma de base de données
   - Stratégies de résilience

5. **`IMPLEMENTATION_GUIDE.md`**
   - Plan jour par jour (14 jours)
   - Exemples de code
   - Bonnes pratiques

### 👨‍💼 Pour Administrer
6. **`docs/ADMIN_GUIDE.md`**
   - Guide utilisation interface admin
   
7. **`docs/YEARLY_RESET.md`**
   - Procédure reset annuel

---

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 14** (App Router) - Framework React
- **TypeScript 5** - Typage statique
- **Tailwind CSS 3.4** - Styles utilitaires
- **Supabase Client** - Interaction avec backend

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL 15 - Base de données
  - Row Level Security (RLS) - Sécurité
  - Auth - Authentification JWT
  - Storage - Fichiers (CVs, logos)

### DevOps
- **Vercel** - Déploiement frontend (recommandé)
- **Git** - Contrôle de version
- **SQL Migrations** - Gestion schéma DB

---

## 🎯 Fonctionnalités Principales

### 1. Système de Phases Équitable
```
Phase 1 (48h)
├─ Qui ? Étudiants SANS stage
├─ Max ? 3 entretiens
└─ Comment ? Flag is_deprioritized = false

Phase 2 (Jusqu'à la veille)
├─ Qui ? TOUS les étudiants
├─ Max ? 6 entretiens (total)
└─ Comment ? Phase gate désactivé
```

### 2. Génération Automatique de Créneaux
```
Admin configure :
├─ Durée interview : 20 min
├─ Buffer : 5 min
├─ Capacité : 2 étudiants
└─ Plages : 9h-12h, 14h-17h

Résultat automatique :
→ 14 créneaux par entreprise
```

### 3. Réservation Atomique
```
Validations en temps réel :
✅ Phase autorisée ?
✅ Limite étudiante respectée ?
✅ Créneau disponible ?
✅ Pas de duplicata ?

→ Transaction ACID
→ 0 surréservation possible
```

### 4. Invitation Rapide Entreprises
```
Admin entre :
├─ Email
└─ Nom entreprise

30 secondes plus tard :
✅ Compte créé
✅ Code généré (ex: TECHCORP2025)
✅ Créneaux générés (18 slots)
✅ Email envoyé
```

---

## 🔑 Concepts Clés à Comprendre

### 1. Row Level Security (RLS)
**Qu'est-ce que c'est ?**
- Sécurité au niveau de chaque ligne de DB
- PostgreSQL filtre automatiquement selon l'utilisateur connecté

**Exemple :**
```sql
-- Policy : Étudiants voient seulement LEURS réservations
CREATE POLICY "Students view own bookings" ON interview_bookings
  FOR SELECT USING (auth.uid() = student_id);
```

**Résultat :**
- Étudiant A ne peut pas voir réservations Étudiant B
- Pas besoin de filtrer côté frontend !

### 2. SECURITY DEFINER Functions
**Qu'est-ce que c'est ?**
- Fonction qui s'exécute avec droits élevés
- Ignore temporairement RLS

**Pourquoi ?**
- Faire opérations multi-tables atomiques
- Exemple : fn_book_interview() doit vérifier + insérer

**Attention :**
- Valider TOUS les paramètres côté fonction
- Vérifier auth.uid() pour sécurité

### 3. Phases (Phase 1 vs Phase 2)
**Comment ça marche ?**

```sql
-- Dans fn_check_student_booking_limit()

IF current_phase = 1 AND is_deprioritized = true THEN
  RETURN error: "Phase 1 pour étudiants sans stage";
END IF;

IF current_phase = 1 AND booking_count >= 3 THEN
  RETURN error: "Max 3 en Phase 1";
END IF;

IF current_phase = 2 AND booking_count >= 6 THEN
  RETURN error: "Max 6 en Phase 2";
END IF;
```

**Modes :**
- **Manual** : Admin bascule manuellement
- **Date-based** : Basculement automatique à minuit

### 4. Optimistic UI
**Pattern utilisé :**
```typescript
// 1. Mise à jour optimiste (immédiate)
setBooking({ status: 'pending', slotId });

try {
  // 2. Appel API
  await supabase.rpc('fn_book_interview', { slotId });
  
  // 3. Succès → Confirmer
  setBooking({ status: 'confirmed' });
  
} catch (error) {
  // 4. Erreur → Rollback
  setBooking(null);
  showError(error.message);
}
```

**Avantage :**
- UI super réactive (pas d'attente)
- Meilleure expérience utilisateur

---

## 🗄️ Base de Données - Tables Principales

### Profiles
**Rôle :** Utilisateurs du système
```sql
profiles
├─ id (UUID, FK auth.users)
├─ email
├─ full_name
├─ role (student | company | admin)
├─ is_deprioritized (BOOL) ← 🔑 CLÉ PHASE 1
├─ company_id (UUID, nullable)
└─ cv_url (TEXT, nullable)
```

### Companies
**Rôle :** Entreprises participantes
```sql
companies
├─ id (UUID)
├─ profile_id (UUID, FK profiles)
├─ name
├─ company_code (TEXT, UNIQUE) ← ex: TECHCORP2025
├─ industry
├─ is_verified (BOOL)
└─ verification_status (pending | verified | rejected)
```

### Events
**Rôle :** Événements annuels
```sql
events
├─ id (UUID)
├─ name
├─ event_date (DATE)
├─ interview_duration_minutes (INT, default 20)
├─ buffer_minutes (INT, default 5)
├─ slots_per_time (INT, default 2) ← Capacité
├─ current_phase (INT, 0|1|2)
├─ phase1_max_bookings (INT, default 3)
└─ phase2_max_bookings (INT, default 6)
```

### Event Slots
**Rôle :** Créneaux d'entretien
```sql
event_slots
├─ id (UUID)
├─ event_id (UUID, FK events)
├─ session_id (UUID, FK sessions)
├─ company_id (UUID, FK companies)
├─ start_time (TIMESTAMPTZ)
├─ end_time (TIMESTAMPTZ)
└─ capacity (INT, default 2)
```

### Interview Bookings
**Rôle :** Réservations étudiants
```sql
interview_bookings
├─ id (UUID)
├─ slot_id (UUID, FK event_slots)
├─ student_id (UUID, FK profiles)
├─ offer_id (UUID, FK offers)
├─ status (confirmed | cancelled | pending)
├─ booking_phase (INT, 1|2) ← Phase au moment réservation
└─ created_at (TIMESTAMPTZ)
```

---

## 🔧 Fonctions RPC Principales

### Réservation
```sql
-- Vérifier disponibilité créneau
fn_check_slot_availability(slot_id UUID)
→ RETURNS { available, current_count, capacity }

-- Vérifier limite étudiant
fn_check_student_booking_limit(student_id UUID, event_id UUID)
→ RETURNS { can_book, current_count, max_allowed, phase }

-- Réserver (ATOMIQUE)
fn_book_interview(slot_id UUID, student_id UUID, offer_id UUID)
→ RETURNS { success, booking_id, message }

-- Annuler
fn_cancel_booking(booking_id UUID)
→ RETURNS { success, message }
```

### Gestion Événements
```sql
-- Générer créneaux pour événement
fn_generate_event_slots(event_id UUID)
→ Génère créneaux pour toutes entreprises vérifiées

-- Ajouter plage horaire + générer créneaux
fn_add_event_time_range(event_id UUID, start_time TIME, end_time TIME)
→ Crée session + génère créneaux automatiquement
```

### Administration
```sql
-- Vérifier/rejeter entreprise
fn_verify_company(company_id UUID, approve BOOL)
→ Met à jour statut + enregistre qui/quand

-- Invitation rapide
quick_invite_company(email TEXT, name TEXT, event_id UUID, ...)
→ Crée compte + entreprise + génère créneaux + envoie email
```

---

## 🎨 Interface - Pages Principales

### Admin
- `/admin` - Dashboard (KPIs, analytics)
- `/admin/events` - Gestion événements
- `/admin/events/[id]/quick-invite` - Invitation rapide
- `/admin/companies` - Vérification entreprises
- `/admin/analytics` - Analytics détaillées

### Entreprise
- `/company` - Dashboard
- `/company/offers` - Mes offres
- `/company/schedule` - Planning interviews
- `/company/students` - Annuaire étudiants

### Étudiant
- `/student` - Dashboard
- `/student/offers` - Parcourir offres
- `/student/offers/[id]` - Détail + réservation
- `/student/bookings` - Mes réservations
- `/student/profile` - Profil + CV

---

## 🧪 Tester le Système (Scénario Complet)

### Prérequis
1. Supabase projet créé
2. Migrations 1-25 appliquées
3. Frontend lancé (`npm run dev`)

### Test Flow (20 min)

**1. Créer Admin (une fois)**
```sql
-- Dans Supabase SQL Editor
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre-email@exemple.com';
```

**2. Admin : Créer Événement**
- Login → `/admin`
- Créer événement "Test Event 2025"
- Date : dans 1 semaine
- Ajouter 2 plages : 9h-12h, 14h-17h
- Vérifier génération créneaux (devrait voir 14 slots)

**3. Admin : Inviter Entreprise**
- Événement → "⚡ Quick Invite"
- Email : votre-vrai-email@gmail.com (pour test)
- Name : Test Company Inc
- Submit
- Vérifier email reçu
- Cliquer lien → Définir mot de passe

**4. Entreprise : Créer Offre**
- Login (email entreprise)
- `/company/offers/new`
- Créer offre "Stage Développeur"
- Département : Opérationnel
- Activer offre

**5. Étudiant : S'inscrire**
- `/signup` (type student)
- Email : autre-email@exemple.com
- **NE PAS** cocher "J'ai déjà un stage" (pour Phase 1)
- Confirmer email
- Login

**6. Étudiant : Réserver**
- `/student/offers`
- Cliquer "Stage Développeur"
- Voir créneaux disponibles
- Réserver 3 créneaux (Phase 1 limit)
- Essayer 4ème → Devrait être refusé

**7. Vérifier**
- Entreprise : `/company/schedule` → Voir étudiant
- Étudiant : `/student/bookings` → Voir 3 réservations
- Admin : `/admin/analytics` → Voir stats

---

## 🚨 Points d'Attention

### ⚠️ Sécurité
1. **Toujours valider côté serveur** (jamais faire confiance au client)
2. **RLS partout** (actif sur toutes les tables)
3. **SECURITY DEFINER avec précaution** (valider auth.uid())
4. **Variables d'environnement** (jamais commit dans Git)

### ⚠️ Performance
1. **Index sur colonnes WHERE** (déjà fait pour les principales)
2. **Limiter les SELECT \*** (utiliser colonnes spécifiques)
3. **Pagination** pour grandes listes
4. **Caching** côté client (SWR/React Query recommandé)

### ⚠️ Migrations
1. **Ordre strict** (numérotation séquentielle)
2. **IF NOT EXISTS** pour colonnes (évite erreurs)
3. **DROP avant CREATE** pour fonctions
4. **Test en dev** avant prod

---

## 🔍 Où Trouver Quoi ?

### "Je veux comprendre comment marche X..."

**...la réservation ?**
→ `SYSTEM_FLOWS.md` section "Flux de Réservation"
→ Migration `20251101000011_booking_engine_functions.sql`

**...les phases ?**
→ `PROJECT_ANALYSIS.md` section "Système de Phases"
→ Migration `20251103000019_enhanced_phase_system.sql`

**...la génération de créneaux ?**
→ `SYSTEM_FLOWS.md` section "Génération de Créneaux"
→ Migration `20251101000008_enhanced_event_slots.sql`

**...l'invitation rapide ?**
→ `IMPLEMENTATION_COMPLETE.md`
→ Migration `20251104000024_quick_invite_system.sql`

### "Je veux modifier X..."

**...les limites de réservation ?**
→ Table `events` : colonnes `phase1_max_bookings`, `phase2_max_bookings`

**...la durée des interviews ?**
→ Table `events` : colonne `interview_duration_minutes`

**...la capacité des créneaux ?**
→ Table `events` : colonne `slots_per_time`

**...les rôles utilisateur ?**
→ Table `profiles` : colonne `role` (student | company | admin)

### "J'ai une erreur X..."

**"relation does not exist"**
→ Migration pas appliquée → Vérifier ordre migrations

**"function does not exist"**
→ Fonction pas créée → Exécuter migration correspondante

**"permission denied"**
→ RLS bloque → Vérifier policies ou utiliser SECURITY DEFINER

**"column already exists"**
→ Migration partielle → Normal, ignorer et continuer

---

## 🎯 Prochaines Étapes Recommandées

### Immédiat (Aujourd'hui)
1. ✅ **Lire ce document** (vous y êtes !)
2. 📖 **Lire `SYSTEM_FLOWS.md`** (comprendre les flux)
3. 🧪 **Tester le flow complet** (scénario ci-dessus)

### Court Terme (Cette Semaine)
4. 🎨 **Polish UI/UX** (identifier pages à améliorer)
5. 🐛 **Fix bugs mineurs** (tester tous les cas limites)
6. 📧 **Personnaliser emails** (templates Supabase)

### Moyen Terme (Ce Mois)
7. 🧪 **Tests E2E** (Playwright/Cypress)
8. 📊 **Analytics avancées** (graphiques temps réel)
9. 🔔 **Notifications** (email confirmation réservation)

### Avant Production
10. ✅ **Tests de charge** (script fourni : `test_concurrent_bookings.py`)
11. 🔐 **Audit sécurité** (vérifier toutes les policies RLS)
12. 📈 **Monitoring** (Sentry pour erreurs)
13. 📖 **Documentation utilisateur** (guides PDF pour étudiants/entreprises)

---

## 💡 Conseils Pro

### Développement
- **Utilisez les seed data** pour dev (Migration 3)
- **Générez les types TypeScript** depuis Supabase (`supabase gen types`)
- **Branchez souvent** (commits atomiques)
- **Testez en local** avant push

### Débogage
- **Supabase Dashboard** → Logs pour voir erreurs backend
- **Browser DevTools** → Network tab pour API calls
- **PostgreSQL logs** → Supabase Dashboard → Database → Logs

### Bonnes Pratiques
- **Nommage fonctions** : `fn_verb_noun` (ex: fn_book_interview)
- **Nommage variables** : `p_` pour paramètres, `v_` pour variables
- **Comments SQL** : Toujours documenter les fonctions complexes
- **Validation input** : Toujours valider côté backend

---

## 📞 Ressources & Support

### Documentation Interne
- Architecture : `PROJECT_ARCHITECTURE.md`
- Flux : `SYSTEM_FLOWS.md`
- Implémentation : `IMPLEMENTATION_GUIDE.md`
- Admin : `docs/ADMIN_GUIDE.md`

### Documentation Externe
- [Supabase Docs](https://supabase.com/docs)
- [Next.js 14](https://nextjs.org/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Scripts Utiles
```bash
# Tester concurrence
python scripts/test_concurrent_bookings.py

# Vérifier état DB
psql -f scripts/check_database_state.sql

# Reset DB (dev uniquement)
psql -f scripts/reset_database.sql
```

---

## ✅ Checklist de Compréhension

Après avoir lu ce guide, vous devriez pouvoir répondre :

- [ ] **Quel est l'objectif du projet ?**
- [ ] **Quelle est la différence entre Phase 1 et Phase 2 ?**
- [ ] **Comment fonctionne le flag `is_deprioritized` ?**
- [ ] **Qu'est-ce que RLS (Row Level Security) ?**
- [ ] **Combien de créneaux sont générés pour un événement 9h-12h + 14h-17h ?**
- [ ] **Quelle fonction appeler pour réserver un créneau ?**
- [ ] **Comment inviter rapidement une entreprise ?**
- [ ] **Où trouver les logs d'erreur ?**

Si vous pouvez répondre à ces questions, vous êtes prêt à développer ! 🚀

---

**🎉 Félicitations !**

Vous avez maintenant une compréhension complète du projet INF Platform.

**Prochaine étape :** Lisez `SYSTEM_FLOWS.md` pour visualiser les flux, puis testez le système avec le scénario complet ci-dessus.

**Bon développement ! 💪**

---

**📅 Dernière Mise à Jour** : 4 Novembre 2025  
**👨‍💻 Créé par** : GitHub Copilot  
**🎯 Version** : 2.0
