# 🏢 Bulk Company Import & Management Strategy

**Date:** 4 Novembre 2025  
**Objectif:** Gérer efficacement des centaines d'entreprises sans rate limiting

---

## 🎯 Problème Résolu

❌ **Avant:** Rate limiting bloque admin (5 registrations/heure)  
✅ **Après:** Import bulk illimité + Company codes stables

---

## 💡 Solution Retenue: **Email-Based avec Company Codes**

### **Pourquoi pas Username-Based ?**

| Critère | Username-Based | Email + Code (Choisi) |
|---------|----------------|----------------------|
| Compatible Supabase | ❌ Complex | ✅ Natif |
| Temp Passwords | ❌ Nécessaire | ✅ Pas besoin |
| Email changeante | ✅ Oui | ✅ Oui (via code) |
| Sécurité | ⚠️ Passwords envoyés | ✅ User set password |
| Forgot Password | ❌ Custom | ✅ Supabase natif |
| Bulk Import | ⚠️ Compliqué | ✅ Simple |

---

## 🏗️ Architecture

### **Structure Database:**

```sql
companies (
  id uuid,
  company_code text UNIQUE,        -- "TECHCORP2025" - Stable!
  company_name text,
  industry text,
  website text,
  profile_id uuid → auth.users,    -- Current auth account
  
  -- Import tracking
  imported_at timestamptz,
  imported_by uuid,
  import_batch_id uuid,
  
  -- Verification
  is_verified boolean,
  verification_status enum
)

profiles (
  id uuid → auth.users.id,
  email text,                      -- Can change
  full_name text,
  role enum
)
```

### **Key Concept:**
- **Email** = Login credentials (peut changer)
- **Company Code** = Stable identifier (ne change jamais)
- **Company Name** = Display name (peut changer)

---

## 📋 Workflows

### **Workflow 1: Bulk Import (Première Fois)**

**Admin prépare CSV:**
```csv
email,company_name,industry,website,company_code
hr@techcorp.com,TechCorp Solutions,Technology,https://techcorp.com,TECHCORP2025
contact@innovate.io,Innovate Labs,Software,https://innovate.io,INNOVATE2025
recruiting@finance.ma,FinanceCorp,Finance,https://finance.ma,FINANCE2025
```

**Admin importe dans dashboard:**

1. **Upload CSV** → `/admin/companies/import`

2. **System process:**
   ```typescript
   for each row:
     → Create auth.users (via Admin API)
     → Send "Welcome - Set Your Password" email
     → Create companies record with company_code
     → Mark as verified (trusted import)
     → Generate batch_id for tracking
   ```

3. **Results:**
   ```
   ✅ 150 companies created
   ✅ 3 companies updated (already exist)
   ⚠️ 2 skipped (missing email)
   ❌ 1 error (invalid email format)
   ```

**Companies receive:**
```
Subject: Welcome to UM6P Speed Recruiting Platform

Hello TechCorp Solutions,

An account has been created for you.

Company Code: TECHCORP2025
Email: hr@techcorp.com

Click here to set your password: [Link]

This link expires in 24 hours.
```

**Company action:**
- Click link → Set password → Login with email

---

### **Workflow 2: Réinvitation (Événement Suivant)**

**6 months later, nouvel événement...**

**Admin cherche company:**
```
Search: "techcorp" 
→ Finds: TECHCORP2025 - TechCorp Solutions
→ Current email: hr@techcorp.com
→ Status: ✅ Verified
→ Past events: 2 participations
```

**Admin clique "Invite to Event":**
```typescript
→ Check: already in event_participants? Non
→ INSERT INTO event_participants (event_id, company_id)
→ Send notification email au current_email
→ Trigger auto-génère slots
```

**Company receives:**
```
Subject: Invitation: Tech Career Fair 2026

Hello TechCorp Solutions,

You've been invited to participate in:
📅 Tech Career Fair 2026
📍 Campus Main Hall
🗓️ December 15, 2026

Your login:
Email: hr@techcorp.com
Company Code: TECHCORP2025

[Login to Dashboard] [View Event Details]
```

**Company action:**
- Login avec email habituel (pas de nouveau password!)
- Voit nouvel événement dans dashboard
- Crée offres de stage
- Voit slots auto-générés

---

### **Workflow 3: Changement d'Email**

**TechCorp change leur email HR...**

**Company contacte admin:**
```
"Notre nouvel email RH est: newhire@techcorp.com"
```

**Admin update dans dashboard:**

1. **Search company:** TECHCORP2025

2. **Click "Update Email":**
   ```
   Old: hr@techcorp.com
   New: newhire@techcorp.com
   ```

3. **System process:**
   ```typescript
   → Update auth.users.email (via Admin API)
   → Update profiles.email
   → Log admin_actions
   → Send notification to BOTH emails
   ```

4. **Company notified:**
   ```
   To: hr@techcorp.com, newhire@techcorp.com
   
   Your login email has been updated.
   
   Old: hr@techcorp.com
   New: newhire@techcorp.com
   
   Company Code: TECHCORP2025 (unchanged)
   
   Use the NEW email to login.
   Password remains the same.
   ```

**Company action:**
- Login avec **newhire@techcorp.com** (même password)
- Company code reste TECHCORP2025

---

### **Workflow 4: Forgot Password**

**Company a oublié son password...**

1. **Company va sur /login**

2. **Click "Forgot Password"**

3. **Enter email:** newhire@techcorp.com

4. **Supabase Auth native:**
   - Send reset link to email
   - Company clicks → Set new password
   - Login normally

**No custom logic needed!** ✅

---

## 🔧 Admin Functions

### **1. Bulk Import**

**Frontend usage:**
```typescript
const result = await supabase.rpc('bulk_import_companies', {
  companies_data: [
    {
      email: 'hr@company.com',
      company_name: 'Company Name',
      industry: 'Technology',
      website: 'https://company.com',
      company_code: 'COMPANY2025' // Optional, auto-generated if null
    },
    // ... more companies
  ]
})

console.log(result)
// {
//   success: true,
//   batch_id: 'uuid',
//   created: 145,
//   updated: 3,
//   skipped: 2,
//   errors: 0
// }
```

---

### **2. Search Companies for Invitation**

**Find companies to invite:**
```typescript
const { data } = await supabase.rpc('search_companies_for_invitation', {
  search_query: 'tech',
  event_id_filter: eventId
})

// Returns:
// [
//   {
//     id: 'uuid',
//     company_code: 'TECHCORP2025',
//     company_name: 'TechCorp Solutions',
//     current_email: 'hr@techcorp.com',
//     industry: 'Technology',
//     is_verified: true,
//     already_invited: false
//   },
//   ...
// ]
```

---

### **3. Update Company Email**

**When company changes email:**
```typescript
const result = await supabase.rpc('update_company_email', {
  company_id_to_update: companyId,
  new_email: 'newemail@company.com'
})

// Also need to update auth.users via Admin API:
await supabaseAdmin.auth.admin.updateUserById(userId, {
  email: 'newemail@company.com'
})
```

---

## 🎨 UI Mockups

### **Admin Import Page:**

```
┌────────────────────────────────────────┐
│ 📦 Bulk Import Companies               │
├────────────────────────────────────────┤
│                                        │
│ [📄 Download CSV Template]             │
│                                        │
│ Drag & drop CSV file here              │
│ or click to browse                     │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  companies_import.csv            │  │
│ │  150 rows                        │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Options:                               │
│ ☑ Auto-verify imported companies      │
│ ☑ Send welcome emails                 │
│ ☐ Skip duplicates                      │
│                                        │
│ [Cancel] [▶️ Import Companies]         │
└────────────────────────────────────────┘
```

### **Company Search for Invitation:**

```
┌────────────────────────────────────────┐
│ Invite Companies to Event              │
├────────────────────────────────────────┤
│                                        │
│ Search: [techcorp_________] 🔍         │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ ☐ TECHCORP2025                   │  │
│ │   TechCorp Solutions             │  │
│ │   hr@techcorp.com                │  │
│ │   Technology | 2 past events     │  │
│ ├──────────────────────────────────┤  │
│ │ ☐ INNOVATE2025                   │  │
│ │   Innovate Labs                  │  │
│ │   contact@innovate.io            │  │
│ │   Software | 1 past event        │  │
│ │   ✅ Already invited              │  │
│ └──────────────────────────────────┘  │
│                                        │
│ 2 selected                             │
│                                        │
│ [Select All] [Invite Selected]         │
└────────────────────────────────────────┘
```

---

## ⚡ Advantages vs Your Username Approach

| Feature | Your Proposal | Our Solution |
|---------|---------------|--------------|
| **Stable Identity** | ✅ Username | ✅ Company Code |
| **Email Can Change** | ✅ Yes | ✅ Yes (admin updates) |
| **Auth Method** | ❌ Custom | ✅ Supabase Native |
| **Password Management** | ❌ Temp passwords | ✅ User sets own |
| **Forgot Password** | ❌ Custom logic | ✅ Native Supabase |
| **Bulk Import** | ⚠️ Complex | ✅ Simple CSV |
| **Rate Limiting Bypass** | ⚠️ Needed | ✅ Built-in |
| **Security** | ⚠️ Passwords in email | ✅ Secure links only |
| **User Experience** | ⚠️ Change password flow | ✅ Standard login |
| **Maintenance** | ❌ Custom code | ✅ Minimal |

---

## 🔒 Security Comparison

### **Your Approach (Username + Temp Password):**
```
❌ Password sent via email (can be intercepted)
❌ Temp password complexity management
❌ Force password change logic
⚠️ User might keep weak temp password
```

### **Our Approach (Invitation Link):**
```
✅ No password in email (only secure link)
✅ User chooses strong password
✅ Link expires after 24h
✅ Standard forgot password flow
```

---

## 🎯 Recommendation

**Use Email-Based with Company Codes** parce que:

1. **Simplicité:** Supabase Auth natif
2. **Sécurité:** Pas de passwords dans emails
3. **UX:** Flow standard que users connaissent
4. **Maintenance:** Moins de code custom
5. **Flexibilité:** Email peut changer via admin
6. **Scalabilité:** Import bulk facile

**Company Code** donne la stabilité que vous voulez sans la complexité du username-based auth.

---

**Qu'en pensez-vous ? Voulez-vous que je vous aide à implémenter l'UI d'import bulk ?** 🚀
