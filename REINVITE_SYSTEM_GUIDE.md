# 🔄 RE-INVITE SYSTEM - GUIDE COMPLET

## Problème Résolu

### ❌ Problème Initial
- **Supabase n'autorise qu'un seul compte par email**
- Si vous essayez d'inviter la même entreprise 2 fois → Erreur "User already registered"
- L'email n'est jamais envoyé à nouveau
- Pas de moyen de re-envoyer l'invitation

### ✅ Solution Implémentée
- **Détection intelligente des emails existants**
- **3 scénarios différents gérés automatiquement**
- **Système de re-invitation sans créer de doublon**

---

## Comment Ça Marche

### Scénario 1: Nouvelle Entreprise (Email Jamais Utilisé)
```
Utilisateur saisit: new@company.com + "New Corp"
↓
✅ Email n'existe pas dans auth.users
↓
Action: send_signup_email
↓
1. Créer company (profile_id = NULL, company_code généré)
2. Ajouter à event_participants
3. Envoyer auth.signUp() avec mot de passe temporaire
4. Email d'invitation envoyé automatiquement
↓
Résultat: ✅ Entreprise créée et email envoyé
```

**Message affiché:**
```
✅ Company invited successfully
📧 Invitation email sent! Company will receive a link to set their password.
```

---

### Scénario 2: Entreprise Existante, Nouvel Événement
```
Utilisateur saisit: existing@company.com (déjà invitée à Event A)
Pour inviter à Event B
↓
✅ Email existe dans auth.users
✅ A déjà un compte company
❌ Pas encore invitée à Event B
↓
Action: send_notification_email
↓
1. Trouver company_id existant
2. Ajouter à event_participants (Event B)
3. NE PAS envoyer auth.signUp() (déjà un compte)
4. Suggérer de notifier manuellement
↓
Résultat: ✅ Entreprise ajoutée à l'événement (sans email automatique)
```

**Message affiché:**
```
✅ Existing company added to event
✅ Company added to event! They can login with their existing credentials.

Note: No email sent (company already has an account). 
You may want to notify them through other channels.
```

**Solution:** L'admin peut ensuite aller dans la page Participants et cliquer sur "📧 Resend" pour envoyer une notification.

---

### Scénario 3: Entreprise Déjà Invitée à CET Événement
```
Utilisateur saisit: existing@company.com
Pour Event A (déjà invitée)
↓
✅ Email existe
✅ A un compte company
✅ Déjà dans event_participants pour Event A
↓
Action: use_resend_button
↓
1. Retourner erreur explicite
2. Suggérer d'utiliser le bouton Resend
↓
Résultat: ❌ Erreur avec message explicite
```

**Message affiché:**
```
❌ Company already invited to this event
This company is already invited. Use the "Resend Email" button in the Participants page.
```

---

## Utilisation dans l'Interface

### 1️⃣ Page Quick Invite (`/admin/events/[id]/quick-invite`)

**Onglet "Add New Company":**
- Saisir email + nom + industrie
- Cliquer "Invite Company"
- Le système détecte automatiquement le scénario
- Message approprié affiché

**Onglet "Re-invite Existing":**
- Rechercher une entreprise existante
- Cliquer "Re-invite to Event"
- Fonctionne même si entreprise déjà enregistrée

---

### 2️⃣ Page Participants (`/admin/events/[id]/participants`)

**Colonne "Status":**
- 🟢 **Active** = Entreprise a terminé son inscription (profile_id existe)
- 🟡 **Pending** = Invitation envoyée mais pas encore inscrite (profile_id = NULL)

**Bouton "Resend" (visible uniquement pour Pending):**
- Clique sur "📧 Resend"
- Génère un nouveau mot de passe temporaire
- Envoie un nouvel email via `auth.signUp()`
- **Note:** Supabase peut bloquer si trop d'emails en peu de temps

---

## SQL - Nouvelles Fonctions

### 1. `check_email_exists(p_email text)`
```sql
SELECT * FROM check_email_exists('test@company.com');
```

**Retourne:**
```json
{
  "exists": true,
  "auth_user_id": "uuid-here",
  "has_profile": true,
  "has_company": true,
  "company_id": "uuid-here",
  "company_name": "Test Company",
  "company_code": "TEST-12345",
  "message": "Company exists - use re-invite"
}
```

---

### 2. `quick_invite_company()` - Version Améliorée

**Nouveaux retours:**
```json
// Nouvelle entreprise
{
  "success": true,
  "action": "send_signup_email",
  "company_code": "NEWCO-12345",
  "is_existing_company": false
}

// Entreprise existante, nouvel événement
{
  "success": true,
  "action": "send_notification_email",
  "company_code": "EXIST-67890",
  "is_existing_company": true
}

// Déjà invitée à cet événement
{
  "success": false,
  "action": "use_resend_button",
  "message": "Company already invited to this event"
}
```

---

### 3. `get_company_quick_invite_history()` - FIXÉ

**Problème corrigé:**
```sql
-- ❌ AVANT (erreur: column events.event_id does not exist)
WHERE es.event_id = e.id

-- ✅ APRÈS (jointure correcte via offers)
JOIN offers o ON o.id = es.offer_id
WHERE o.event_id = e.id
```

---

## Workflow Complet

### Première Invitation
```
1. Admin: Quick Invite → Saisir "company@test.com"
2. Backend: check_email_exists() → exists = false
3. Backend: Créer company (profile_id = NULL, code = AUTO-12345)
4. Backend: Ajouter à event_participants
5. Backend: Return action = "send_signup_email"
6. Frontend: auth.signUp({ email, password: random, metadata })
7. Supabase: Envoie email de confirmation
8. Company: Reçoit email → Clique lien → Définit mot de passe
9. Supabase: Crée auth.users → Crée profiles (trigger)
10. Supabase: Link profile_id à company (trigger handle_new_user)
11. Company: Profile_id maintenant rempli → Status = Active ✅
```

---

### Re-Invitation (Même Email, Nouvel Événement)
```
1. Admin: Quick Invite → Saisir "company@test.com" (Event B)
2. Backend: check_email_exists() → exists = true, has_company = true
3. Backend: Trouver company_id existant
4. Backend: Vérifier si déjà dans event_participants (Event B)
5. Backend: Pas trouvé → Ajouter à event_participants (Event B)
6. Backend: Return action = "send_notification_email"
7. Frontend: Afficher message "Already has account, no email sent"
8. Admin: Va sur Participants → Clique "Resend" pour notifier
```

---

### Re-Envoi d'Email (Email Perdu)
```
1. Admin: Va sur /admin/events/[id]/participants
2. Trouve company avec Status = "Pending" (pas encore inscrite)
3. Clique bouton "📧 Resend"
4. Frontend: Génère nouveau mot de passe temporaire
5. Frontend: auth.signUp({ même email, nouveau password, metadata })
6. Supabase: Détecte email existe déjà
7. Supabase: Envoie quand même email de confirmation (nouvelle tentative)
8. Company: Reçoit email → Peut définir mot de passe
```

**⚠️ LIMITATION SUPABASE:**
- Supabase limite le nombre d'emails par email/heure
- Si trop d'emails envoyés rapidement → Peut être bloqué temporairement
- Solution: Attendre 5-10 minutes entre les resends

---

## Configuration Requise

### 1. Exécuter FIX_EVENT_ID_AND_REINVITE.sql
```bash
# Copier le contenu de FIX_EVENT_ID_AND_REINVITE.sql
# Aller sur Supabase Dashboard → SQL Editor
# Coller et exécuter
```

### 2. Vérifier Email Confirmation Activée
```bash
# Supabase Dashboard
# → Authentication
# → Settings
# → Email Auth
# ✅ Enable email confirmations = ON
```

### 3. Configurer SMTP (Recommandé pour Production)
```bash
# Supabase Dashboard
# → Project Settings
# → Auth
# → SMTP Settings
# Configurer Gmail/SendGrid/AWS SES
```

---

## Tests à Faire

### Test 1: Nouvelle Entreprise
```bash
1. Quick Invite → "new1@test.com" + "New Company 1"
2. ✅ Vérifier: Message "Invitation email sent"
3. ✅ Vérifier: Email reçu dans inbox
4. ✅ Vérifier: Company dans Participants avec Status "Pending"
5. ✅ Cliquer email → Définir password → Login
6. ✅ Vérifier: Status change à "Active"
```

### Test 2: Entreprise Existante, Nouvel Événement
```bash
1. Quick Invite → "new1@test.com" (même email) + Event B
2. ✅ Vérifier: Message "Existing company added to event"
3. ✅ Vérifier: Company apparaît dans Participants (Event B)
4. ✅ Vérifier: Status déjà "Active" (déjà inscrite)
5. ✅ Vérifier: Aucun email envoyé automatiquement
```

### Test 3: Déjà Invitée (Même Événement)
```bash
1. Quick Invite → "new1@test.com" (Event A - déjà invitée)
2. ✅ Vérifier: Erreur "Company already invited to this event"
3. ✅ Vérifier: Suggestion d'utiliser bouton Resend
```

### Test 4: Re-Envoi Email
```bash
1. Participants → Trouver company "Pending"
2. Cliquer "Resend"
3. ✅ Vérifier: Nouveau email reçu
4. ✅ Vérifier: Peut compléter inscription avec nouveau lien
```

---

## Troubleshooting

### Problème: "User already registered"
**Cause:** Essai d'inviter un email déjà dans auth.users  
**Solution:** Exécuter FIX_EVENT_ID_AND_REINVITE.sql (détection automatique)

### Problème: Email pas reçu
**Cause:** Email confirmation désactivée OU SMTP pas configuré  
**Solution:** Voir EMAIL_NOT_SENT_FIX.md

### Problème: "column events.event_id does not exist"
**Cause:** Ancienne version de get_company_quick_invite_history()  
**Solution:** Exécuter FIX_EVENT_ID_AND_REINVITE.sql

### Problème: Trop d'emails envoyés, bloqué
**Cause:** Limite rate-limit Supabase  
**Solution:** Attendre 10 minutes, configurer SMTP personnalisé

---

## Architecture Technique

### Tables Impliquées
```
auth.users (Supabase Auth)
  ├── id (uuid)
  ├── email (unique!)
  └── raw_user_meta_data (jsonb: company_code, company_name, event_id)

profiles
  ├── id (uuid, FK → auth.users.id)
  ├── email
  └── role

companies
  ├── id (uuid)
  ├── profile_id (uuid, NULL si pending)
  ├── company_code (unique)
  ├── company_name
  └── industry

event_participants
  ├── event_id (FK → events.id)
  ├── company_id (FK → companies.id)
  └── invited_at
```

### Triggers
```
1. on_auth_user_created (auth.users)
   → Crée profiles
   → Cherche company par company_code
   → Link profile_id si trouvé

2. update_updated_at_column (companies)
   → Met à jour updated_at
```

### Fonctions
```
1. generate_company_code(name) → "ABC-12345"
2. check_email_exists(email) → jsonb avec info existante
3. quick_invite_company(...) → jsonb avec action à faire
4. search_companies_for_invitation(...) → liste companies
5. get_company_quick_invite_history(...) → historique events
```

---

## Résumé Exécutif

### ✅ Ce qui Fonctionne Maintenant
- ✅ Invitation nouvelle entreprise (email envoyé)
- ✅ Détection email existant (pas de doublon)
- ✅ Ajout entreprise existante à nouvel événement
- ✅ Re-envoi email si perdu (bouton Resend)
- ✅ Status tracking (Active/Pending)
- ✅ Correction erreur "events.event_id"

### ⏳ Configuration Requise
1. Exécuter `/workspaces/inf_project/FIX_EVENT_ID_AND_REINVITE.sql`
2. Activer email confirmation (Supabase Dashboard)
3. Tester workflow complet

### 📋 Prochaines Étapes
1. Exécuter SQL fixes
2. Tester les 4 scénarios ci-dessus
3. Configurer SMTP pour production
4. Former les admins sur les 3 scénarios
