# 🚀 Quick Invite System - Ultra-Seamless Workflow

**Inspiré par:** LinkedIn Events, Eventbrite, Stripe Customers, HubSpot Contacts  
**Philosophie:** Maximum simplicity, zero overhead, instant results

---

## 🎯 Ce Que Vous Avez Obtenu

### **Workflow 1: Ajouter Nouvelle Entreprise** ✨
```
Admin entre:  Email + Nom
             ↓
System fait:  ✅ Company créée
             ✅ Company code généré (auto)
             ✅ Invited to event
             ✅ Slots générés (trigger)
             ✅ Email envoyé
             ↓
Company:      📧 Reçoit email
             🔐 Clique + Set password
             ✅ Connectée + Event visible
```

**Temps total:** ~30 secondes par entreprise

### **Workflow 2: Ré-inviter Entreprise Existante** 🔄
```
Admin:        🔍 Search "techcorp"
             ↓
System:       Shows: TECHCORP2025
             📊 Participated 2 times
             📅 Last: Tech Fair 2024
             ↓
Admin:        Click "Re-Invite"
             ↓
System:       ✅ Invited to new event
             ✅ Slots generated
             📧 Notification sent
             ↓
Company:      📧 Email: "You're invited to Tech Fair 2025!"
             ✅ Login (same credentials)
```

**Temps total:** ~5 secondes par entreprise

---

## 📋 Files Créés

### **1. Migration 24** (`/supabase/migrations/20251104000024_quick_invite_system.sql`)

**Functions:**
- `generate_company_code(name)` - Auto-génère codes uniques
- `quick_invite_company(email, name, event_id)` - Magic one-step invite
- `search_companies_for_invitation(query, event_id)` - Search with history
- `get_company_participation_history(company_id)` - Full stats

**Features:**
```sql
-- Example 1: Invite new company
SELECT quick_invite_company(
  'hr@newco.com',
  'New Company Inc',
  'event-uuid-here'
);

-- Returns:
{
  "success": true,
  "company_code": "NEWCOMPANYINC2025",
  "is_new_company": true,
  "already_invited": false,
  "slots_generated": true,
  "message": "✅ Company created and invited! Welcome email will be sent to hr@newco.com",
  "next_step": "send_invite_email"
}

-- Example 2: Re-invite returning company
SELECT quick_invite_company(
  'hr@techcorp.com',  -- Existing email
  'TechCorp Solutions',
  'new-event-uuid'
);

-- Returns:
{
  "success": true,
  "company_code": "TECHCORP2025",  -- Same code from before!
  "is_new_company": false,
  "already_invited": false,
  "slots_generated": true,
  "message": "🎉 Company re-invited successfully! Notification sent to hr@techcorp.com"
}

-- Example 3: Search companies
SELECT * FROM search_companies_for_invitation('tech', 'event-uuid');

-- Returns:
company_name          | company_code      | total_participations | already_invited
--------------------- | ----------------- | -------------------- | ---------------
TechCorp Solutions    | TECHCORP2025      | 2                    | false
Innovate Tech Labs    | INNOVATETECH2025  | 1                    | false
```

### **2. Quick Invite UI** (`/frontend/app/admin/events/[id]/quick-invite/page.tsx`)

**Two Tabs:**

**Tab 1: Add New Company**
- Email field (required)
- Company Name field (required)
- Industry dropdown (optional)
- Website field (optional)
- Submit → Instant invite!

**Tab 2: Re-invite Returning Companies**
- Search bar (name/code/email)
- Results show:
  - Company name + code
  - Email, industry, website
  - Participation count + last event
  - "Re-Invite" button (or "✓ Already Invited")

---

## 🎨 UX Highlights

### **Inspired by LinkedIn Events:**
- ✅ One-step add (no multi-page wizard)
- ✅ Search shows context (participation history)
- ✅ Clear visual feedback (✓ Already Invited)
- ✅ No manual code entry (auto-generated)

### **Inspired by Stripe Customers:**
- ✅ Auto-complete search
- ✅ Rich customer cards (history, metadata)
- ✅ One-click actions

### **Inspired by Eventbrite:**
- ✅ Instant email sending
- ✅ Event-specific invitations
- ✅ Re-usable contact database

---

## 🔧 How It Works Technically

### **Database Flow:**

```sql
-- When admin invites new company:

1. quick_invite_company() checks if email exists
   ↓
2. If new:
   - Generate code: "TECHCORP2025"
   - INSERT into companies
   - Mark as verified (admin-invited)
   ↓
3. INSERT into event_participants
   ↓
4. Trigger auto_generate_slots_on_company_invite fires
   ↓
5. Slots created for all sessions
   ↓
6. Return success + company_code
```

### **Frontend Flow:**

```typescript
// Component handles:
1. Form submission
   ↓
2. Call supabase.rpc('quick_invite_company', {...})
   ↓
3. If new company → Send Supabase Auth invite email
   ↓
4. Show success message with company code
   ↓
5. Clear form for next invite
```

---

## 📧 Email Templates

### **New Company Invitation:**
```
Subject: Welcome to UM6P Speed Recruiting Platform

Hi [Company Name],

You've been invited to participate in:
📅 [Event Name]
📍 [Location]
🗓️ [Date]

Your account details:
Company Code: [CODE]
Email: [EMAIL]

Click here to set your password and access your dashboard:
[MAGIC LINK]

This link expires in 24 hours.

Looking forward to seeing you at the event!

UM6P Recruitment Team
```

### **Re-invitation Email:**
```
Subject: You're Invited to [Event Name]

Hi [Company Name],

We'd love to have you back!

You've been invited to:
📅 [Event Name]
📍 [Location]
🗓️ [Date]

Login with your existing credentials:
[LOGIN LINK]

Your interview slots have been auto-generated and are waiting for you.

See you there!
```

---

## 🧪 Testing Workflow

### **Test 1: Add New Company**

1. **Navigate:**
   ```
   /admin/events/[event-id]/quick-invite
   ```

2. **Fill form:**
   - Email: `hr@testcompany.com`
   - Name: `Test Company Inc`
   - Industry: `Technology`
   - Website: `https://testcompany.com`

3. **Submit → Expected:**
   ```
   ✅ Company created and invited!
   Company Code: TESTCOMPANYINC2025
   ✉️ Invitation email sent to hr@testcompany.com
   ```

4. **Verify in DB:**
   ```sql
   SELECT company_code, company_name, is_verified
   FROM companies
   WHERE company_name = 'Test Company Inc';
   
   -- Should show:
   -- TESTCOMPANYINC2025 | Test Company Inc | true
   
   SELECT COUNT(*) 
   FROM event_slots
   WHERE company_id = (SELECT id FROM companies WHERE company_code = 'TESTCOMPANYINC2025');
   
   -- Should show: 18 slots (9 morning + 9 afternoon)
   ```

### **Test 2: Search & Re-Invite**

1. **Switch to "Re-invite" tab**

2. **Search:** `test`

3. **Expected results:**
   ```
   Test Company Inc [TESTCOMPANYINC2025]
   📧 hr@testcompany.com
   🏢 Technology
   📊 1 past participation
   Last: [Previous Event] (2024-12-15)
   [Re-Invite Button]
   ```

4. **Click Re-Invite → Expected:**
   ```
   🎉 Company re-invited successfully!
   ```

5. **Button changes to:** `✓ Invited` (disabled)

### **Test 3: Company Receives Email & Logs In**

1. **Check email inbox** (`hr@testcompany.com`)

2. **Should receive:**
   - Supabase invitation email
   - Magic link to set password

3. **Click link → Set password**

4. **Login → Should see:**
   - Event listed in dashboard
   - Interview slots ready
   - Can create offers

---

## 🎓 Admin Training (5-Minute Guide)

### **Scenario A: First Event Ever**

**You have 50 companies to invite:**

1. **Open:** `/admin/events/[event-id]/quick-invite`

2. **For each company:**
   - Tab: "Add New Company"
   - Enter: Email + Name
   - Optional: Industry + Website
   - Click: "Invite Company"
   - **Takes 30 seconds per company**

3. **Total time:** 25 minutes for 50 companies

4. **Companies receive email immediately**

### **Scenario B: Annual Event (Returning Companies)**

**Last year you had 50 companies, this year inviting 40 of them back + 10 new:**

1. **Open:** `/admin/events/[new-event-id]/quick-invite`

2. **For returning companies (40):**
   - Tab: "Re-invite Returning Companies"
   - Search: Company name (e.g., "tech")
   - Click: "Re-Invite" for each
   - **Takes 5 seconds per company**
   - **Total: 3 minutes for 40 companies**

3. **For new companies (10):**
   - Tab: "Add New Company"
   - Same as Scenario A
   - **Total: 5 minutes for 10 companies**

4. **Grand total:** 8 minutes instead of 25 minutes!

---

## 🔒 Security & Permissions

### **Who Can Access:**
- ✅ Admin only (role = 'admin')
- ❌ Companies cannot invite other companies
- ❌ Students cannot access

### **RLS Policies:**
```sql
-- quick_invite_company() is SECURITY DEFINER
-- But checks admin role internally:
IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  RETURN error
```

### **Email Security:**
- ✅ Uses Supabase Auth (secure)
- ✅ Magic links expire in 24h
- ✅ No passwords sent via email
- ✅ Rate limiting still applies to company signups

---

## 📊 Metrics You Can Track

### **Invitation Analytics:**

```sql
-- Companies invited this month
SELECT COUNT(*) 
FROM event_participants
WHERE invited_at >= DATE_TRUNC('month', CURRENT_DATE);

-- New vs Returning companies
SELECT 
  CASE WHEN ch.participation_count = 1 THEN 'New' ELSE 'Returning' END as company_type,
  COUNT(*) as count
FROM event_participants ep
JOIN (
  SELECT company_id, COUNT(*) as participation_count
  FROM event_participants
  GROUP BY company_id
) ch ON ch.company_id = ep.company_id
WHERE ep.event_id = 'your-event-id'
GROUP BY company_type;

-- Top participating companies
SELECT 
  c.company_name,
  c.company_code,
  COUNT(*) as total_events
FROM event_participants ep
JOIN companies c ON ep.company_id = c.id
GROUP BY c.id, c.company_name, c.company_code
ORDER BY total_events DESC
LIMIT 10;
```

---

## 🚀 Ready to Use!

### **Next Steps:**

1. **Apply Migration 24:**
   ```bash
   # In Supabase Dashboard → SQL Editor
   # Copy-paste: /supabase/migrations/20251104000024_quick_invite_system.sql
   # Run
   ```

2. **Test the UI:**
   ```
   Navigate to: /admin/events/[any-event-id]/quick-invite
   ```

3. **Add your first company:**
   - Use tab 1: "Add New Company"
   - Enter real email (to test email sending)
   - Submit!

4. **Verify:**
   - Check database (company created, code generated)
   - Check email inbox (invitation received)
   - Login as company (see event)

---

**Profitez du workflow le plus simple du marché !** 🎉
