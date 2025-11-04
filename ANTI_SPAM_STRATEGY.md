# 🛡️ Stratégie Anti-Spam & Sécurité

**Date:** 4 Novembre 2025  
**Objectif:** Protéger la plateforme contre les inscriptions frauduleuses et le spam

---

## 📋 Problèmes à Éviter

1. **Spam d'inscriptions entreprises** - Faux comptes qui polluent le dashboard admin
2. **Entreprises non vérifiées visibles** - Étudiants voient des offres de compagnies douteuses
3. **Flood de demandes** - Surcharge du système par des robots
4. **Énumération d'emails** - Attaquants testent quels emails existent

---

## ✅ Solutions Implémentées

### **Niveau 1: Vérification Email (Supabase Auth)**

**Comment ça marche:**
```
Inscription → Email de confirmation → Clic sur lien → Account activé
```

**Vérification manuelle depuis Supabase:**
1. Dashboard Supabase → **Authentication** → **Users**
2. Trouver l'utilisateur
3. Cliquer **"..."** → **"Confirm user"**

**Ou via SQL:**
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'hr.techcorp@outlook.com';
```

---

### **Niveau 2: Workflow de Vérification Entreprises** 🏢

#### États d'une Entreprise:

```
📝 PENDING (défaut à l'inscription)
   ↓
   → Admin Review
   ↓
✅ VERIFIED (approuvée)  OU  ❌ REJECTED (refusée)
```

#### Règles de Visibilité:

| Acteur | Voit Quoi |
|--------|-----------|
| **Admin** | TOUTES les entreprises (pending, verified, rejected) |
| **Entreprise** | Son propre profil uniquement |
| **Étudiant** | SEULEMENT entreprises VERIFIED + INVITÉES à un événement actif |

#### Workflow Complet:

```mermaid
1. Entreprise s'inscrit
   → verification_status = 'pending'
   → is_verified = false
   
2. Admin reçoit notification
   → "🏢 New Company Registration"
   → "Company X needs verification"
   
3. Admin vérifie la légitimité
   → Visite le site web
   → Google la compagnie
   → Vérifie LinkedIn
   
4a. Si légitime:
    → Clic "Verify Company"
    → verification_status = 'verified'
    → is_verified = true
    → Notification envoyée à l'entreprise
    
4b. Si spam/frauduleux:
    → Clic "Reject Company"
    → Fournir raison
    → verification_status = 'rejected'
    → Notification envoyée à l'entreprise
```

---

### **Niveau 3: Protection des Invitations**

**Trigger de Protection:**
```sql
-- Empêche d'inviter une entreprise non vérifiée
CREATE TRIGGER trg_check_company_verified
  BEFORE INSERT ON event_participants
  → Vérifie que verification_status = 'verified'
  → Si non: RAISE EXCEPTION
```

**Résultat:**
- ✅ Admin ne peut inviter QUE des entreprises vérifiées
- ❌ Impossible d'inviter une entreprise pending/rejected
- 🔒 Protection au niveau base de données (pas juste UI)

---

### **Niveau 4: Rate Limiting** ⏱️

**Limites Imposées:**
- **5 inscriptions max** par IP par heure
- **3 tentatives max** par email par 24h

**Table de Tracking:**
```sql
registration_attempts (
  ip_address,
  email,
  role,
  success,
  created_at
)
```

**Fonction de Vérification:**
```sql
check_registration_rate_limit(ip_address, email)
  → Compte les tentatives récentes
  → Retourne true/false
```

**Intégration Frontend Recommandée:**
```typescript
// Dans votre API route /api/signup
const ipAddress = request.headers['x-forwarded-for']
const canRegister = await checkRateLimit(ipAddress, email)

if (!canRegister) {
  return { error: 'Too many registration attempts. Please try again later.' }
}
```

---

### **Niveau 5: Notifications Admin** 🔔

**Auto-notification quand:**
1. Nouvelle entreprise s'inscrit
2. Nouvelle tentative d'inscription suspecte
3. Rate limit dépassé

**Contenu de la notification:**
```
🏢 New Company Registration
Company "TechCorp Solutions" has registered and needs verification.
[View Company] → /admin/companies
```

---

## 🎯 Fonctions Admin Utiles

### **1. Vérifier une Entreprise**

**SQL:**
```sql
SELECT verify_company(
  'company-uuid-here'::uuid,
  'Checked website and LinkedIn - legitimate company'
);
```

**Frontend (à implémenter):**
```typescript
await supabase.rpc('verify_company', {
  company_id_to_verify: companyId,
  admin_notes: 'Verified via LinkedIn and company website'
})
```

---

### **2. Rejeter une Entreprise**

**SQL:**
```sql
SELECT reject_company(
  'company-uuid-here'::uuid,
  'Suspicious registration - fake company website'
);
```

**Frontend:**
```typescript
await supabase.rpc('reject_company', {
  company_id_to_reject: companyId,
  rejection_reason: 'Company website does not exist. Likely spam.'
})
```

---

### **3. Voir les Entreprises en Attente**

**SQL:**
```sql
SELECT 
  c.id,
  c.company_name,
  c.industry,
  c.website,
  p.email,
  p.full_name,
  c.created_at,
  c.verification_status
FROM companies c
JOIN profiles p ON c.profile_id = p.id
WHERE c.verification_status = 'pending'
ORDER BY c.created_at DESC;
```

---

## 🚨 Indicateurs de Spam à Surveiller

### **Red Flags - Rejeter Immédiatement:**
- ❌ Site web n'existe pas
- ❌ Domaine email gratuit (gmail, yahoo) pour une entreprise
- ❌ Nom d'entreprise générique ("Test Company", "ABC Corp")
- ❌ Pas de présence en ligne (Google, LinkedIn)
- ❌ Email pattern suspect (random@random.com)
- ❌ Multiple inscriptions même IP

### **Yellow Flags - Vérifier Plus:**
- ⚠️ Site web très récent (whois lookup)
- ⚠️ Pas de profil LinkedIn
- ⚠️ Industrie "Other" ou vague
- ⚠️ Email ne match pas le domaine du site

### **Green Flags - Probablement Légitime:**
- ✅ Site web professionnel établi
- ✅ Profil LinkedIn d'entreprise actif
- ✅ Email corporatif (@nomcompagnie.com)
- ✅ Présence sur réseaux sociaux
- ✅ Apparaît dans Google News/Articles

---

## 📊 Dashboard Admin Recommandé

**Section "Pending Verifications":**

```
┌─────────────────────────────────────────┐
│ 🔔 Pending Company Verifications (3)   │
├─────────────────────────────────────────┤
│                                         │
│ TechCorp Solutions                      │
│ hr.techcorp@outlook.com                 │
│ Technology | www.techcorp-solutions.com│
│ Registered: 2 hours ago                 │
│ [✅ Verify] [❌ Reject] [🔍 Details]    │
│                                         │
├─────────────────────────────────────────┤
│ ABC Company                             │
│ test@gmail.com                          │
│ Other | No website                      │
│ Registered: 5 minutes ago               │
│ [✅ Verify] [❌ Reject] [🔍 Details]    │
│ ⚠️ Warning: Generic name, no website   │
└─────────────────────────────────────────┘
```

---

## 🔐 Protection RLS (Row Level Security)

**Companies Table:**
```sql
-- Admin voit tout
Policy: "Admins can see all companies"
  → role = 'admin'

-- Entreprise voit son profil
Policy: "Companies can see their own profile"
  → profile_id = auth.uid()

-- Étudiant voit SEULEMENT verified + invited
Policy: "Students see only verified invited companies"
  → is_verified = true
  → verification_status = 'verified'
  → EXISTS dans event_participants
  → Event is_active = true
```

**Offers Table:**
```sql
-- Étudiant voit SEULEMENT offres de verified + invited companies
Policy: "Students see offers from verified invited companies"
  → Company is_verified = true
  → Company verification_status = 'verified'
  → Company EXISTS dans event_participants
```

---

## ⚡ Quick Actions pour Vous

### **Option 1: Vérification Manuelle Immédiate**

Pour votre test actuel avec Outlook:

1. **Via Supabase Dashboard:**
   - Auth → Users → Trouver hr.techcorp@outlook.com
   - Click "..." → "Confirm user"

2. **Via SQL Editor:**
```sql
-- 1. Confirmer l'email
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'hr.techcorp@outlook.com';

-- 2. Vérifier la compagnie
UPDATE companies 
SET 
  is_verified = true,
  verification_status = 'verified',
  verified_at = NOW()
WHERE profile_id = (
  SELECT id FROM auth.users 
  WHERE email = 'hr.techcorp@outlook.com'
);
```

### **Option 2: Interface Admin (Recommandé pour Production)**

À implémenter dans `/admin/companies`:
- Liste des pending companies
- Bouton "Verify" qui appelle `verify_company()`
- Bouton "Reject" avec modal pour raison
- Affichage des red/yellow flags automatiques

---

## 📝 Checklist de Vérification Manuelle

Quand une nouvelle entreprise s'inscrit:

- [ ] **Email vérifié** (clic sur lien de confirmation)
- [ ] **Site web existe** et est professionnel
- [ ] **WHOIS du domaine** (pas créé hier)
- [ ] **LinkedIn de l'entreprise** existe et actif
- [ ] **Google la compagnie** - articles, mentions
- [ ] **Email corporatif** (pas @gmail, @yahoo)
- [ ] **Contact match** (nom de la personne réel)
- [ ] **Pas de red flags** listés ci-dessus

Si tous ✅ → **Verify Company**  
Si doute → **Demander plus d'infos**  
Si clairement spam → **Reject Company**

---

## 🎯 Résumé de la Protection

| Protection | Niveau | Automatique | Impact Spam |
|------------|--------|-------------|-------------|
| Email Verification | Auth | ✅ Oui | 🟢 Bloque bots basiques |
| Company Verification | Business | ❌ Manuel | 🔴 Bloque 99% spam |
| Rate Limiting | Infrastructure | ✅ Oui | 🟢 Bloque flood/bots |
| RLS Policies | Database | ✅ Oui | 🔴 Isole les données |
| Invite-Only Events | Business | ✅ Oui | 🔴 Contrôle total admin |

**Conclusion:** Avec ce système, même si 100 spammeurs s'inscrivent, **aucun n'apparaîtra jamais aux étudiants** car:
1. Ils ne seront pas vérifiés par l'admin
2. Ils ne seront jamais invités aux événements
3. Les RLS policies les cachent automatiquement

---

**🚀 Prêt pour un système sécurisé et sans spam !**
