# 🔄 Flux Système - INF Platform

## 📋 Table des Matières
1. [Flux Utilisateur Principal](#flux-utilisateur-principal)
2. [Flux de Réservation](#flux-de-réservation)
3. [Flux de Vérification Entreprise](#flux-de-vérification-entreprise)
4. [Flux de Génération de Créneaux](#flux-de-génération-de-créneaux)
5. [Flux d'Invitation Rapide](#flux-dinvitation-rapide)
6. [Flux des Phases](#flux-des-phases)

---

## 1. Flux Utilisateur Principal

### 🎯 Parcours Étudiant Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INSCRIPTION                                               │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
    /signup → Formulaire
    ├─ Email : student@school.fr
    ├─ Nom complet
    ├─ Téléphone
    └─ ☐ "J'ai déjà trouvé mon stage"
                        │
                        ▼ Submit
                        │
    Supabase Auth.signUp({
      email, password,
      data: {
        full_name,
        phone,
        is_deprioritized: checked,  ← 🔑 CLÉ SYSTÈME PHASE
        role: 'student'
      }
    })
                        │
                        ▼
    Trigger: auto_create_profile
    → INSERT INTO profiles (
        id, email, full_name, 
        is_deprioritized, role
      )
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. EMAIL CONFIRMATION                                        │
└─────────────────────────────────────────────────────────────┘
                        │
    Supabase envoie email
    Étudiant clique lien
                        │
                        ▼ Confirmed
                        │
┌─────────────────────────────────────────────────────────────┐
│ 3. CONNEXION                                                 │
└─────────────────────────────────────────────────────────────┘
                        │
    /login → Supabase Auth
    → JWT token
    → Redirect /student
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. DASHBOARD ÉTUDIANT                                        │
└─────────────────────────────────────────────────────────────┘
                        │
    /student → Affiche:
    ├─ Mes réservations (0)
    ├─ Profil completion (60%)
    ├─ Phase actuelle (Phase 1)
    └─ Actions rapides
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. COMPLÉTER PROFIL                                          │
└─────────────────────────────────────────────────────────────┘
                        │
    /student/profile
    ├─ Upload CV (PDF)
    ├─ Spécialisation
    └─ Année d'études
                        │
                        ▼ Sauvegarde
                        │
    Storage.upload('student-cvs/{user_id}/cv.pdf')
    UPDATE profiles SET cv_url = url
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PARCOURIR OFFRES                                          │
└─────────────────────────────────────────────────────────────┘
                        │
    /student/offers
    │
    SELECT * FROM offers
    WHERE is_active = true
    AND company_id IN (
      SELECT id FROM companies 
      WHERE is_verified = true
    )
                        │
                        ▼
    Affiche grille d'offres:
    ├─ Titre poste
    ├─ Entreprise (vérifiée ✓)
    ├─ Département
    ├─ Tags
    └─ [Voir détails]
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. VOIR DÉTAILS + RÉSERVER                                  │
└─────────────────────────────────────────────────────────────┘
                        │
    /student/offers/[id]
                        │
                        ▼
    Affiche:
    ├─ Description offre
    ├─ Compétences requises
    ├─ Créneaux disponibles
    │   ├─ 9:00-9:20 (2/2 places) ❌ Complet
    │   ├─ 9:25-9:45 (1/2 places) ✅ Disponible
    │   └─ 9:50-10:10 (0/2 places) ✅ Disponible
    └─ Bouton [Réserver]
                        │
    Étudiant clique sur créneau 9:25
                        │
                        ▼ VOIR FLUX RÉSERVATION
```

---

## 2. Flux de Réservation

### 🎯 Booking Atomique avec Validations

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTUDIANT CLIQUE "RÉSERVER"                                   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
    [Frontend] Optimistic Update
    → Affiche "⏳ Réservation en cours..."
    → Désactive bouton
                        │
                        ▼
    supabase.rpc('fn_book_interview', {
      p_slot_id: 'uuid-créneau',
      p_student_id: auth.user.id,
      p_offer_id: 'uuid-offre'
    })
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ [BACKEND] FONCTION fn_book_interview()                      │
│ SECURITY DEFINER - Exécute avec droits élevés               │
└─────────────────────────────────────────────────────────────┘
                        │
    BEGIN TRANSACTION;
                        │
                        ▼
    ┌─────────────────────────────────────────┐
    │ VALIDATION 1: Vérifier Phase            │
    └─────────────────────────────────────────┘
                        │
    SELECT * FROM events WHERE id = event_id
    → current_phase = 1 (Phase prioritaire)
                        │
    SELECT is_deprioritized FROM profiles
    WHERE id = student_id
    → is_deprioritized = true (a déjà un stage)
                        │
                        ▼
    ❌ REJETÉ si Phase 1 ET is_deprioritized = true
    → RETURN error: "Phase 1 réservée aux étudiants sans stage"
    → ROLLBACK;
                        │
                        ▼ ✅ OK (Phase 2 OU étudiant prioritaire)
                        │
    ┌─────────────────────────────────────────┐
    │ VALIDATION 2: Limite Réservations       │
    └─────────────────────────────────────────┘
                        │
    CALL fn_check_student_booking_limit(
      student_id, event_id
    )
                        │
    COUNT(*) FROM interview_bookings
    WHERE student_id = X 
    AND event_id = Y
    AND status = 'confirmed'
                        │
    ├─ Phase 1 → Max 3 réservations
    └─ Phase 2 → Max 6 réservations
                        │
                        ▼
    ❌ REJETÉ si limite atteinte
    → RETURN error: "Vous avez atteint le maximum de 3 interviews (Phase 1)"
    → ROLLBACK;
                        │
                        ▼ ✅ OK (sous la limite)
                        │
    ┌─────────────────────────────────────────┐
    │ VALIDATION 3: Capacité Créneau          │
    └─────────────────────────────────────────┘
                        │
    SELECT * FROM event_slots
    WHERE id = slot_id
    FOR UPDATE;  ← 🔒 LOCK PESSIMISTE (race condition)
                        │
    COUNT(*) FROM interview_bookings
    WHERE slot_id = X
    AND status = 'confirmed'
                        │
    current_count = 1
    capacity = 2
                        │
                        ▼
    ❌ REJETÉ si current_count >= capacity
    → RETURN error: "Ce créneau est complet"
    → ROLLBACK;
                        │
                        ▼ ✅ OK (place disponible)
                        │
    ┌─────────────────────────────────────────┐
    │ VALIDATION 4: Duplicata                 │
    └─────────────────────────────────────────┘
                        │
    SELECT * FROM interview_bookings
    WHERE student_id = X
    AND slot_id = Y
                        │
                        ▼
    ❌ REJETÉ si existe déjà
    → RETURN error: "Vous avez déjà réservé ce créneau"
    → ROLLBACK;
                        │
                        ▼ ✅ OK (pas de duplicata)
                        │
    ┌─────────────────────────────────────────┐
    │ INSERTION RÉSERVATION                   │
    └─────────────────────────────────────────┘
                        │
    INSERT INTO interview_bookings (
      slot_id,
      student_id,
      offer_id,
      status,
      booking_phase
    ) VALUES (
      p_slot_id,
      p_student_id,
      p_offer_id,
      'confirmed',
      current_phase  ← Enregistre phase actuelle
    )
    RETURNING id, created_at;
                        │
                        ▼
    COMMIT;
                        │
                        ▼
    RETURN json_build_object(
      'success', true,
      'booking_id', new_booking_id,
      'message', 'Réservation confirmée !',
      'slot_time', slot_start_time
    )
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ [FRONTEND] Réception Réponse                                │
└─────────────────────────────────────────────────────────────┘
                        │
    ✅ SI SUCCESS
    ├─ Affiche toast vert "✓ Réservation confirmée !"
    ├─ Update UI (slot marqué complet)
    ├─ Redirect /student/bookings
    └─ Refresh compteur "Mes réservations (1)"
                        │
    ❌ SI ERROR
    ├─ Affiche toast rouge avec message
    ├─ Rollback optimistic update
    └─ Ré-active bouton
```

---

## 3. Flux de Vérification Entreprise

### 🎯 Processus Admin

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ENTREPRISE S'INSCRIT                                      │
└─────────────────────────────────────────────────────────────┘
                        │
    /signup (type = company)
    ├─ Email entreprise
    ├─ Nom entreprise
    ├─ Secteur
    └─ Site web
                        │
                        ▼
    Supabase Auth.signUp({
      email,
      password,
      data: {
        company_name,
        industry,
        website,
        role: 'company'
      }
    })
                        │
                        ▼
    Trigger auto_create_profile
    → INSERT INTO profiles (role = 'company')
    → INSERT INTO companies (
        name,
        industry,
        website,
        is_verified = false,  ← 🔑 PAR DÉFAUT NON VÉRIFIÉ
        verification_status = 'pending'
      )
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ENTREPRISE EN ATTENTE                                     │
└─────────────────────────────────────────────────────────────┘
                        │
    Connexion → /company/dashboard
                        │
    Affiche banner:
    ⚠️ "Votre compte est en attente de vérification.
        Vous pourrez créer des offres une fois approuvé."
                        │
    Fonctionnalités limitées:
    ├─ ❌ Créer offres (désactivé)
    ├─ ❌ Voir créneaux (vide)
    └─ ✅ Compléter profil
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ADMIN VOIT DEMANDE                                        │
└─────────────────────────────────────────────────────────────┘
                        │
    /admin/companies
                        │
    SELECT * FROM companies
    WHERE verification_status = 'pending'
    ORDER BY created_at DESC
                        │
    Affiche liste:
    ┌──────────────────────────────────────┐
    │ 🏢 TechCorp                          │
    │ 📧 contact@techcorp.com              │
    │ 🌐 www.techcorp.com                  │
    │ 📅 Inscrit le: 01/11/2025            │
    │                                      │
    │ [✅ Approuver] [❌ Rejeter]          │
    └──────────────────────────────────────┘
                        │
    Admin clique "Approuver"
                        │
                        ▼
    supabase.rpc('fn_verify_company', {
      p_company_id: 'uuid',
      p_approve: true
    })
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. [BACKEND] fn_verify_company()                            │
└─────────────────────────────────────────────────────────────┘
                        │
    BEGIN TRANSACTION;
                        │
    -- Vérifier que user est admin
    SELECT role FROM profiles
    WHERE id = auth.uid()
    → ASSERT role = 'admin'
                        │
    -- Mettre à jour entreprise
    UPDATE companies SET
      is_verified = p_approve,
      verification_status = CASE 
        WHEN p_approve THEN 'verified'
        ELSE 'rejected'
      END,
      verified_by = auth.uid(),
      verified_at = NOW()
    WHERE id = p_company_id
                        │
    COMMIT;
                        │
                        ▼
    RETURN success message
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ENTREPRISE APPROUVÉE                                      │
└─────────────────────────────────────────────────────────────┘
                        │
    Entreprise se reconnecte
    → /company/dashboard
                        │
    Banner vert:
    ✅ "Votre compte est vérifié ! Vous pouvez maintenant créer des offres."
                        │
    Fonctionnalités débloquées:
    ├─ ✅ Créer offres
    ├─ ✅ Voir créneaux générés
    └─ ✅ Voir inscriptions étudiants
```

---

## 4. Flux de Génération de Créneaux

### 🎯 Processus Admin

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN CRÉE ÉVÉNEMENT                                      │
└─────────────────────────────────────────────────────────────┘
                        │
    /admin/events → "Créer Événement"
                        │
    Formulaire:
    ├─ Nom: "Speed Recruiting 2025"
    ├─ Date: 15/12/2025
    ├─ Durée interview: 20 min
    ├─ Buffer: 5 min
    └─ Capacité: 2 étudiants/créneau
                        │
                        ▼
    INSERT INTO events (
      name,
      event_date,
      interview_duration_minutes,
      buffer_minutes,
      slots_per_time,
      phase1_max_bookings,
      phase2_max_bookings,
      current_phase
    ) VALUES (
      'Speed Recruiting 2025',
      '2025-12-15',
      20,
      5,
      2,
      3,
      6,
      1  ← Démarre en Phase 1
    )
    RETURNING id;
                        │
                        ▼
    Event créé → ID: abc-123
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMIN AJOUTE PLAGES HORAIRES                             │
└─────────────────────────────────────────────────────────────┘
                        │
    /admin/events/abc-123
    → Section "Plages Horaires"
                        │
    Formulaire:
    ├─ Nom session: "Session Matin"
    ├─ Heure début: 09:00
    └─ Heure fin: 12:00
                        │
                        ▼
    supabase.rpc('fn_add_event_time_range', {
      p_event_id: 'abc-123',
      p_session_name: 'Session Matin',
      p_start_time: '09:00',
      p_end_time: '12:00'
    })
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. [BACKEND] fn_add_event_time_range()                      │
└─────────────────────────────────────────────────────────────┘
                        │
    BEGIN TRANSACTION;
                        │
    -- Créer session
    INSERT INTO speed_recruiting_sessions (
      event_id,
      name,
      start_time,
      end_time
    ) VALUES (
      p_event_id,
      'Session Matin',
      '09:00',
      '12:00'
    )
    RETURNING id AS session_id;
                        │
                        ▼
    -- Appeler générateur de créneaux
    CALL fn_generate_event_slots(
      p_event_id: 'abc-123'
    )
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. [BACKEND] fn_generate_event_slots()                      │
└─────────────────────────────────────────────────────────────┘
                        │
    -- Récupérer config événement
    SELECT 
      interview_duration_minutes,  → 20
      buffer_minutes,               → 5
      slots_per_time                → 2
    FROM events WHERE id = event_id
                        │
                        ▼
    -- Pour chaque entreprise vérifiée
    FOR company IN (
      SELECT id FROM companies 
      WHERE is_verified = true
    ) LOOP
                        │
      -- Pour chaque session
      FOR session IN (
        SELECT * FROM speed_recruiting_sessions
        WHERE event_id = p_event_id
      ) LOOP
                        │
        -- Calculer créneaux
        current_time := session.start_time  → 09:00
                        │
        WHILE current_time + interval < session.end_time LOOP
                        │
          slot_end := current_time + 20 min  → 09:20
                        │
          -- Insérer créneau
          INSERT INTO event_slots (
            event_id,
            session_id,
            company_id,
            start_time,
            end_time,
            capacity
          ) VALUES (
            event_id,
            session.id,
            company.id,
            current_time,   → 09:00
            slot_end,       → 09:20
            2
          )
                        │
          -- Avancer au prochain créneau
          current_time := slot_end + buffer  → 09:25
                        │
        END LOOP;
      END LOOP;
    END LOOP;
                        │
                        ▼
    COMMIT;
                        │
    Résultat pour Session Matin (9h-12h):
    ├─ 09:00 - 09:20  ✅
    ├─ 09:25 - 09:45  ✅
    ├─ 09:50 - 10:10  ✅
    ├─ 10:15 - 10:35  ✅
    ├─ 10:40 - 11:00  ✅
    ├─ 11:05 - 11:25  ✅
    └─ 11:30 - 11:50  ✅
                        │
    Total: 7 créneaux × N entreprises
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ADMIN AJOUTE AUTRE SESSION                               │
└─────────────────────────────────────────────────────────────┘
                        │
    Même processus pour:
    ├─ Session Après-midi
    └─ 14:00 - 17:00
                        │
    → Génère 7 créneaux supplémentaires
                        │
    TOTAL FINAL: 14 créneaux × N entreprises
```

---

## 5. Flux d'Invitation Rapide

### 🎯 Quick Invite System

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN OUVRE QUICK INVITE                                 │
└─────────────────────────────────────────────────────────────┘
                        │
    /admin/events/abc-123
    → Bouton "⚡ Quick Invite" (bleu, prominent)
                        │
                        ▼
    /admin/events/abc-123/quick-invite
                        │
    Affiche 2 tabs:
    ├─ [➕ Add New Company]  ← Sélectionné
    └─ [🔍 Re-invite Returning]
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. TAB 1: NOUVELLE ENTREPRISE                                │
└─────────────────────────────────────────────────────────────┘
                        │
    Formulaire:
    ├─ Email: hr@newcompany.com
    ├─ Name: New Company Inc
    ├─ Industry: Technology
    └─ Website: https://newcompany.com
                        │
    Admin clique "🚀 Invite Company"
                        │
                        ▼
    supabase.rpc('quick_invite_company', {
      p_email: 'hr@newcompany.com',
      p_company_name: 'New Company Inc',
      p_event_id: 'abc-123',
      p_industry: 'Technology',
      p_website: 'https://newcompany.com'
    })
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. [BACKEND] quick_invite_company()                         │
└─────────────────────────────────────────────────────────────┘
                        │
    BEGIN TRANSACTION;
                        │
    -- Générer company code unique
    company_code := generate_company_code(
      'New Company Inc'
    )
    → "NEWCOMPANYINC2025"
                        │
                        ▼
    -- Créer compte Auth
    INSERT INTO auth.users (
      email,
      email_confirmed_at,
      raw_user_meta_data
    ) VALUES (
      'hr@newcompany.com',
      NOW(),  ← Auto-confirmé !
      jsonb_build_object(
        'company_name', 'New Company Inc',
        'role', 'company'
      )
    )
    RETURNING id AS user_id;
                        │
                        ▼
    -- Créer profil
    INSERT INTO profiles (
      id,
      email,
      role,
      company_id
    ) VALUES (
      user_id,
      'hr@newcompany.com',
      'company',
      NULL  ← Sera lié après
    )
                        │
                        ▼
    -- Créer entreprise
    INSERT INTO companies (
      profile_id,
      name,
      company_code,
      industry,
      website,
      is_verified,
      verification_status
    ) VALUES (
      user_id,
      'New Company Inc',
      'NEWCOMPANYINC2025',
      'Technology',
      'https://newcompany.com',
      true,  ← Auto-vérifiée !
      'verified'
    )
    RETURNING id AS company_id;
                        │
                        ▼
    -- Lier profil à entreprise
    UPDATE profiles 
    SET company_id = company_id
    WHERE id = user_id;
                        │
                        ▼
    -- Inviter à l'événement
    INSERT INTO event_participants (
      event_id,
      company_id,
      invited_at
    ) VALUES (
      'abc-123',
      company_id,
      NOW()
    )
                        │
                        ▼
    -- Générer créneaux pour cette entreprise
    CALL fn_generate_event_slots(
      p_event_id: 'abc-123',
      p_company_id: company_id  ← Seulement pour cette entreprise
    )
    → Génère 14 créneaux (2 sessions)
                        │
                        ▼
    COMMIT;
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ENVOI EMAIL INVITATION                                    │
└─────────────────────────────────────────────────────────────┘
                        │
    [Frontend] Appelle Supabase Auth Admin API
                        │
    supabase.auth.admin.inviteUserByEmail(
      'hr@newcompany.com',
      {
        data: {
          company_name: 'New Company Inc',
          company_code: 'NEWCOMPANYINC2025',
          event_name: 'Speed Recruiting 2025',
          event_id: 'abc-123'
        },
        redirectTo: `${origin}/company`
      }
    )
                        │
                        ▼
    Supabase envoie email:
    ┌──────────────────────────────────────┐
    │ 📧 Invitation to Speed Recruiting    │
    │                                      │
    │ Bonjour New Company Inc,             │
    │                                      │
    │ Vous êtes invité à participer à:    │
    │ 🎓 Speed Recruiting 2025             │
    │                                      │
    │ Votre Company Code:                  │
    │ NEWCOMPANYINC2025                    │
    │                                      │
    │ [Définir mon mot de passe] (expire 24h) │
    └──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ENTREPRISE ACTIVE COMPTE                                  │
└─────────────────────────────────────────────────────────────┘
                        │
    Entreprise clique lien
    → Page "Définir mot de passe"
                        │
    Formulaire:
    ├─ Email: hr@newcompany.com (pré-rempli)
    └─ Mot de passe: [________]
                        │
                        ▼
    Supabase Auth.updateUser(password)
    → Compte activé
                        │
                        ▼
    Auto-login → Redirect /company
                        │
    Dashboard affiche:
    ├─ ✅ Compte vérifié
    ├─ 📅 Événement: Speed Recruiting 2025
    ├─ 🎯 Créneaux disponibles: 14
    └─ 🚀 Action: "Créer une offre"
                        │
                        ▼
    Total temps: ~30 secondes ! 🎉
```

---

## 6. Flux des Phases

### 🎯 Transition Phase 1 → Phase 2

```
┌─────────────────────────────────────────────────────────────┐
│ SCÉNARIO: Mode Manuel (Admin contrôle)                      │
└─────────────────────────────────────────────────────────────┘
                        │
    État initial:
    ├─ current_phase = 1
    ├─ phase1_max_bookings = 3
    └─ phase2_max_bookings = 6
                        │
                        ▼
    PHASE 1 EN COURS (48h)
    ├─ Étudiants sans stage peuvent réserver
    ├─ Max 3 entretiens
    └─ Gate actif (is_deprioritized = false requis)
                        │
    Exemple étudiant 1 (sans stage):
    ├─ Réserve créneau A → ✅ OK (1/3)
    ├─ Réserve créneau B → ✅ OK (2/3)
    └─ Réserve créneau C → ✅ OK (3/3)
                        │
    Exemple étudiant 2 (avec stage):
    └─ Essaie de réserver → ❌ REJETÉ
       "Phase 1 réservée aux étudiants sans stage"
                        │
                        ▼
    Après 48h, Admin décide:
    /admin/events/abc-123/phases
    → Bouton "Passer en Phase 2"
                        │
                        ▼
    UPDATE events
    SET current_phase = 2
    WHERE id = 'abc-123'
                        │
                        ▼
    PHASE 2 EN COURS
    ├─ TOUS les étudiants peuvent réserver
    ├─ Max 6 entretiens (total cumulé)
    └─ Gate désactivé (is_deprioritized ignoré)
                        │
    Exemple étudiant 1 (avait 3 en Phase 1):
    ├─ Réserve créneau D → ✅ OK (4/6)
    ├─ Réserve créneau E → ✅ OK (5/6)
    └─ Réserve créneau F → ✅ OK (6/6)
                        │
    Exemple étudiant 2 (0 en Phase 1):
    ├─ Réserve créneau X → ✅ OK (1/6)
    ├─ Réserve créneau Y → ✅ OK (2/6)
    └─ ...peut réserver jusqu'à 6
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ SCÉNARIO: Mode Automatique (Date-based)                     │
└─────────────────────────────────────────────────────────────┘
                        │
    Configuration événement:
    ├─ phase_mode = 'date-based'
    ├─ phase1_start_date = '2025-12-10 00:00'
    ├─ phase1_end_date = '2025-12-12 23:59'
    ├─ phase2_start_date = '2025-12-13 00:00'
    └─ phase2_end_date = '2025-12-14 23:59'
                        │
                        ▼
    [FONCTION fn_check_student_booking_limit()]
    Calcule automatiquement phase actuelle:
                        │
    current_datetime := NOW()
                        │
    IF current_datetime < phase1_start_date THEN
      → Phase 0 (Fermé)
    ELSIF current_datetime BETWEEN phase1_start AND phase1_end THEN
      → Phase 1 (Prioritaire)
    ELSIF current_datetime BETWEEN phase2_start AND phase2_end THEN
      → Phase 2 (Tous)
    ELSE
      → Phase 0 (Fermé)
    END IF
                        │
                        ▼
    Transition automatique à minuit ! 🕛
    ├─ 10/12 00:00 → Phase 1 commence
    ├─ 13/12 00:00 → Phase 2 commence
    └─ 15/12 00:00 → Phase 0 (fermé)
```

---

## 📊 Légende

### Symboles Utilisés
- ✅ = Succès / Autorisé
- ❌ = Erreur / Rejeté
- ⚠️ = Avertissement
- 🔒 = Lock / Sécurité
- 🔑 = Point clé
- ⏳ = En cours
- 📧 = Email
- 🎓 = Étudiant
- 🏢 = Entreprise
- 👨‍💼 = Admin

### États Possibles
- `pending` : En attente
- `confirmed` : Confirmé
- `cancelled` : Annulé
- `verified` : Vérifié
- `rejected` : Rejeté

---

**📅 Dernière Mise à Jour** : 4 Novembre 2025  
**🎯 Version** : 2.0

*Pour plus de détails techniques, consultez `PROJECT_ARCHITECTURE.md`*
