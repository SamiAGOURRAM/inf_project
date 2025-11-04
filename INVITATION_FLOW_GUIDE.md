# 🔐 Flow d'Invitation Entreprise - Guide Complet

## 📋 Problème Identifié & Solution

### ❌ Problème
Lorsqu'une entreprise est invitée :
1. L'email de confirmation Supabase est envoyé
2. Le lien redirige vers `/company` directement
3. Le profil n'est pas toujours créé à temps (race condition)
4. Pas de page dédiée pour définir le mot de passe
5. Sécurité : n'importe qui connaissant l'email pourrait essayer de set password

### ✅ Solution Implémentée

**Nouveau Flow Sécurisé :**
1. Admin invite entreprise
2. Email envoyé avec lien magique **unique et temporaire**
3. Lien redirige vers `/auth/set-password` (page sécurisée)
4. Entreprise définit son mot de passe
5. Auto-redirect vers `/company` dashboard

---

## 🔄 Flow Complet (Étape par Étape)

### 1️⃣ Admin Invite Entreprise

**Page :** `/admin/events/[id]/quick-invite`

```typescript
// Admin remplit formulaire
{
  email: "contact@newcompany.com",
  companyName: "New Company Inc",
  industry: "Technology",
  website: "https://newcompany.com"
}

// Clique "🚀 Invite Company"
```

**Backend (`quick_invite_company` RPC) :**
```sql
BEGIN TRANSACTION;

-- 1. Générer company code unique
company_code := "NEWCOMPANYINC2025"

-- 2. Créer dans auth.users (compte Supabase)
INSERT INTO auth.users (email, ...)

-- 3. Trigger auto_create_profile s'exécute
INSERT INTO profiles (id, email, role = 'company')

-- 4. Créer entreprise
INSERT INTO companies (
  profile_id,
  company_name,
  company_code,
  is_verified = true  -- Auto-vérifié
)

-- 5. Inviter à l'événement
INSERT INTO event_participants (event_id, company_id)

-- 6. Générer créneaux (18 slots)
CALL fn_generate_event_slots(event_id, company_id)

COMMIT;
```

**Frontend envoie email :**
```typescript
// Génère mot de passe temporaire (sécurisé)
const tempPassword = crypto.getRandomValues() + timestamp

// Envoie invitation
await supabase.auth.signUp({
  email: "contact@newcompany.com",
  password: tempPassword,  // Temporaire, jamais partagé
  options: {
    data: {
      company_name: "New Company Inc",
      company_code: "NEWCOMPANYINC2025",
      role: 'company',
      event_name: eventName
    },
    emailRedirectTo: `${origin}/auth/set-password`  // ← IMPORTANT !
  }
})
```

---

### 2️⃣ Entreprise Reçoit Email

**Email Supabase (Template par défaut) :**

```
Subject: Confirm your signup

Welcome to INF Platform!

Company Name: New Company Inc
Company Code: NEWCOMPANYINC2025

Click the link below to confirm your email and set your password:

[Confirm your email]  ← Lien magique unique (expire 24h)

This link expires in 24 hours.
```

**Lien magique contient :**
- `https://app.supabase.co/...?token=xxx&type=signup`
- Token unique, usage unique
- Expire après 24h
- Supabase redirige automatiquement vers `emailRedirectTo`

---

### 3️⃣ Entreprise Clique sur Lien

**Séquence de redirection :**

```
1. Entreprise clique lien dans email
   ↓
2. Supabase vérifie token
   ↓
3. Si valide, crée session + redirige vers :
   https://yourapp.com/auth/callback?code=xxx
   ↓
4. Callback route.ts s'exécute
   ↓
5. Exchange code pour session
   ↓
6. Vérifie profil existe (avec retry 1s)
   ↓
7. Redirige selon role :
   - student → /student
   - company → /company
   - admin → /admin
   ↓
8. MAIS AVANT, Supabase redirige vers emailRedirectTo :
   /auth/set-password
```

**Note :** Le lien contient le token d'authentification, donc seule la personne qui a reçu l'email peut accéder à la page.

---

### 4️⃣ Page Set Password (Sécurisée)

**Page :** `/auth/set-password`

**Validations de sécurité :**

```typescript
// 1. Vérifie session valide (token du lien)
const { session } = await supabase.auth.getSession()

if (!session) {
  // ❌ Pas de session = lien invalide/expiré
  return <ErrorPage message="Invalid or expired link" />
}

// 2. Session existe = utilisateur authentifié via lien magique
// 3. Affiche formulaire set password
```

**Formulaire :**
```tsx
<form onSubmit={handleSetPassword}>
  <input 
    type="password" 
    placeholder="New password"
    minLength={8}
  />
  <input 
    type="password" 
    placeholder="Confirm password"
  />
  <button>Set Password & Continue</button>
</form>
```

**Soumission :**
```typescript
const handleSetPassword = async (e) => {
  e.preventDefault()
  
  // Valider passwords match
  if (password !== confirmPassword) {
    setError("Passwords don't match")
    return
  }
  
  // Mettre à jour password
  const { error } = await supabase.auth.updateUser({
    password: password
  })
  
  if (error) throw error
  
  // ✅ Success ! Redirect vers /company
  setTimeout(() => router.push('/company'), 2000)
}
```

---

### 5️⃣ Entreprise Accède au Dashboard

**Page :** `/company`

```typescript
// Entreprise est maintenant authentifiée avec son nouveau password
// Session active
// Profil existe avec role = 'company'

// Affiche dashboard avec :
- Mes événements
- Créer offre
- Voir créneaux (18 slots générés)
- Planning interviews
```

---

## 🔒 Sécurité du Flow

### ✅ Points Sécurisés

1. **Lien unique et temporaire**
   - Token généré par Supabase
   - Usage unique
   - Expire après 24h
   - Impossible de deviner

2. **Page Set Password protégée**
   - Accessible uniquement avec session valide
   - Session créée uniquement via lien magique
   - Pas de bypass possible

3. **Mot de passe temporaire jamais exposé**
   - Généré côté client (crypto secure)
   - Jamais envoyé par email
   - Utilisé uniquement pour signUp()
   - Remplacé immédiatement par l'entreprise

4. **Validation session**
   - `supabase.auth.getSession()` vérifie JWT
   - JWT signé par Supabase (impossible à forger)
   - Expire automatiquement

### ❌ Attaques Impossible

**Attaque 1 : Quelqu'un connaît l'email**
```
Attaquant : "Je connais contact@company.com"
→ Va sur /auth/set-password directement
→ Pas de session = Erreur "Invalid link"
→ ❌ Échec
```

**Attaque 2 : Quelqu'un intercepte l'email**
```
Attaquant : Intercepte email
→ Clique sur lien avant l'entreprise
→ Définit mot de passe en premier
→ ⚠️ RISQUE si email compromis

Solution : Entreprise contacte admin
→ Admin réinvite (invalide ancien lien)
→ Nouveau lien envoyé
```

**Attaque 3 : Replay attack**
```
Attaquant : Sauvegarde lien, essaie de réutiliser
→ Token déjà utilisé
→ Supabase retourne erreur "Token already used"
→ ❌ Échec
```

---

## 🔄 Flow Alternatifs

### Scénario A : Entreprise Existante (Ré-invitation)

```
Admin invite entreprise qui existe déjà
↓
Backend détecte : email existe
↓
NE PAS créer nouveau compte
↓
Juste ajouter à event_participants
↓
Message : "Company added to event! They can login with existing credentials."
↓
❌ PAS d'email envoyé (compte existe déjà)
```

**Code :**
```typescript
if (data.action === 'send_notification_email') {
  // EXISTING COMPANY - Already has account
  setResult({
    message: "Company added to event!\n✅ They can login with existing credentials."
  })
  // Note: No email sent - company already has account
}
```

### Scénario B : Lien Expiré

```
Entreprise clique lien après 24h
↓
Supabase : Token expired
↓
Redirect /auth/set-password?error=expired
↓
Page affiche : "Link expired. Please request new invitation."
↓
Bouton : "Contact Admin"
```

**Solution :**
```
Admin → Quick Invite page → Tab "Re-invite"
→ Search entreprise
→ Clique "Re-Invite"
→ Nouveau lien envoyé
```

### Scénario C : Entreprise Oublie Mot de Passe

```
Entreprise : "J'ai oublié mon mot de passe"
↓
Va sur /login
↓
Clique "Forgot password?"
↓
Supabase envoie reset password email
↓
Lien → /auth/reset-password
↓
Définit nouveau password
↓
Login normal
```

---

## 🎯 Erreurs Possibles & Solutions

### Erreur 1 : "Cannot coerce result to single JSON object"

**Cause :** Race condition - profil pas encore créé par trigger

**Solution :** Retry après 1s (déjà implémenté dans callback)

```typescript
// Premier essai
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (!profile) {
  // Wait 1s et retry
  await sleep(1000)
  const { data: retryProfile } = await supabase...
}
```

### Erreur 2 : "Profile still not found"

**Cause :** Trigger auto_create_profile pas exécuté

**Diagnostic :**
```sql
-- Vérifier trigger existe
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Vérifier user existe dans auth.users
SELECT * FROM auth.users 
WHERE email = 'contact@company.com';

-- Vérifier profil créé
SELECT * FROM profiles 
WHERE email = 'contact@company.com';
```

**Solution :**
```sql
-- Créer profil manuellement si manquant
INSERT INTO profiles (id, email, role)
SELECT id, email, 'company'
FROM auth.users
WHERE email = 'contact@company.com'
ON CONFLICT (id) DO NOTHING;
```

### Erreur 3 : "Email not sent"

**Cause :** Rate limit Supabase (max 3-4 emails/heure en dev)

**Solution :**
```
Option 1 : Configurer SMTP custom
→ Supabase Dashboard → Settings → Auth
→ Custom SMTP settings

Option 2 : Passer en plan payant
→ Augmente limite emails

Option 3 : Tester avec vraies adresses
→ Éviter adresses temporaires (10minutemail, etc.)
```

---

## 📧 Personnaliser Template Email

### Configuration Supabase

```
Dashboard → Authentication → Email Templates → Invite User
```

**Template Recommandé :**

```html
<h2>Welcome to INF Platform!</h2>

<p>Hello <strong>{{ .Data.company_name }}</strong>,</p>

<p>You have been invited to participate in:</p>
<p><strong>📅 {{ .Data.event_name }}</strong></p>

<p>Your company code: <code>{{ .Data.company_code }}</code></p>

<p>Click the link below to activate your account and set your password:</p>

<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #4F46E5; color: white; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; display: inline-block;">
    Set My Password
  </a>
</p>

<p><small>This link expires in 24 hours.</small></p>

<p>If you didn't expect this invitation, please ignore this email.</p>

<hr>
<p><small>INF Platform 2025 - Speed Recruiting System</small></p>
```

**Variables disponibles :**
- `{{ .Email }}` - Email entreprise
- `{{ .ConfirmationURL }}` - Lien magique
- `{{ .Data.company_name }}` - Nom entreprise
- `{{ .Data.company_code }}` - Code entreprise
- `{{ .Data.event_name }}` - Nom événement
- `{{ .Data.event_id }}` - ID événement

---

## ✅ Checklist Test Flow Complet

### Préparation
- [ ] Migrations 1-25 appliquées
- [ ] Trigger `on_auth_user_created` existe
- [ ] Page `/auth/set-password` déployée
- [ ] Template email configuré (optionnel)

### Test Nouvelle Entreprise
1. [ ] Admin : Aller `/admin/events/[id]/quick-invite`
2. [ ] Remplir formulaire (email réel pour test)
3. [ ] Submit → Vérifier message success
4. [ ] Vérifier email reçu dans boîte
5. [ ] Cliquer lien email
6. [ ] Vérifier redirection `/auth/set-password`
7. [ ] Définir password (min 8 chars)
8. [ ] Vérifier redirection `/company`
9. [ ] Vérifier dashboard affiche créneaux
10. [ ] Logout puis login avec nouveau password

### Test Ré-invitation
11. [ ] Admin : Tab "Re-invite Returning"
12. [ ] Search entreprise créée avant
13. [ ] Vérifier "Already Invited" badge
14. [ ] Créer nouvel événement
15. [ ] Re-invite vers nouvel événement
16. [ ] Vérifier message "added to event"
17. [ ] Company login → Voir 2 événements

### Test Sécurité
18. [ ] Essayer `/auth/set-password` sans session → Erreur
19. [ ] Essayer réutiliser lien déjà utilisé → Erreur
20. [ ] Attendre 24h → Lien expiré (ou tester en changeant config)

---

## 📊 Diagramme Flow Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN INVITE                                              │
└─────────────────────────────────────────────────────────────┘
                        │
      /admin/events/[id]/quick-invite
                        │
                        ▼
      Formulaire : Email + Name + Industry
                        │
                        ▼
      RPC : quick_invite_company()
      ├─ Créer auth.user
      ├─ Trigger → profile
      ├─ Créer company (verified)
      ├─ Inviter à event
      └─ Générer 18 slots
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SEND EMAIL                                                │
└─────────────────────────────────────────────────────────────┘
                        │
      auth.signUp({
        email,
        password: tempPassword,  // Crypto secure
        emailRedirectTo: '/auth/set-password'
      })
                        │
                        ▼
      📧 Supabase envoie email
      Subject: "Confirm your signup"
      Body: 
        - Company name
        - Company code
        - [Magic Link]  ← Token unique
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. COMPANY CLICKS LINK                                       │
└─────────────────────────────────────────────────────────────┘
                        │
      Email link:
      https://app.supabase.co/.../auth/confirm
      ?token=xxx&type=signup&redirect_to=/auth/set-password
                        │
                        ▼
      Supabase validates token
      ✅ Valid → Creates session
      ❌ Invalid → Error
                        │
                        ▼
      Redirect: /auth/callback?code=yyy
                        │
                        ▼
      callback/route.ts:
      ├─ Exchange code for session
      ├─ Check profile (retry 1s if needed)
      ├─ Detect role = 'company'
      └─ BUT emailRedirectTo takes precedence!
                        │
                        ▼
      Final redirect: /auth/set-password
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SET PASSWORD PAGE                                         │
└─────────────────────────────────────────────────────────────┘
                        │
      /auth/set-password
                        │
      Validations:
      ├─ Check session exists ✅
      ├─ Get company name from session
      └─ Show form
                        │
      Form:
      ├─ New password (min 8 chars)
      └─ Confirm password
                        │
                        ▼
      Submit:
      supabase.auth.updateUser({
        password: newPassword
      })
                        │
                        ▼
      ✅ Success message
      ⏳ Wait 2s
      → Redirect /company
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. COMPANY DASHBOARD                                         │
└─────────────────────────────────────────────────────────────┘
                        │
      /company
                        │
      Authenticated with new password
      Session active
      Profile loaded
                        │
      Dashboard shows:
      ├─ Welcome banner
      ├─ My events (1)
      ├─ Create offer button
      ├─ View slots (18 generated)
      └─ Quick actions
                        │
                        ▼
      🎉 DONE! Company can now:
      ├─ Create offers
      ├─ See student bookings
      ├─ Manage schedule
      └─ Login anytime with email + password
```

---

## 🎯 Résumé

### Flow en 5 Étapes
1. **Admin invite** → Email + Name → RPC creates all
2. **Email sent** → Lien magique unique (24h)
3. **Company clicks** → Session créée via token
4. **Set password** → Page sécurisée (session required)
5. **Dashboard** → Access complet

### Sécurité
- ✅ Lien unique, usage unique, expire 24h
- ✅ Session required pour set password
- ✅ Pas de bypass possible
- ✅ Mot de passe temporaire jamais exposé

### UX
- ✅ Simple : 1 clic dans email
- ✅ Clair : Page dédiée set password
- ✅ Guidé : Auto-redirect vers dashboard
- ✅ Secure : Pas de risque si email connu

---

**📅 Dernière Mise à Jour** : 4 Novembre 2025  
**🔐 Version** : 2.0  
**✅ Statut** : Flow complet implémenté et testé
