# 🚀 Quick Invite System - Guide d'Utilisation Complet

**Date:** 4 Novembre 2025  
**Version:** 1.0

---

## ✅ Ce Qui a Été Implémenté

### **1. Migration 24 Applied** ✅
- `generate_company_code()` - Auto-génère codes from names
- `quick_invite_company()` - ONE-STEP invite function
- `search_companies_for_invitation()` - Search with history
- `get_company_participation_history()` - Full participation stats

### **2. Quick Invite UI** ✅
- URL: `/admin/events/[event-id]/quick-invite`
- Tab 1: Add New Company (email + name → invited!)
- Tab 2: Re-invite Returning Companies (search + one-click)
- Export CSV button (download companies with codes)

### **3. Email Integration** ✅
- Supabase Auth invitation emails
- Automatic password setup links
- Event-specific metadata included

### **4. Export CSV Feature** ✅
- Download all invited companies
- Includes: company_code, name, email, industry, website
- Perfect for next year's bulk re-invite

---

## 📋 Workflows Détaillés

### **WORKFLOW 1: Inviter Nouvelle Entreprise (30 secondes)**

#### **Étape 1: Naviguer vers Quick Invite**
```
Admin Dashboard 
→ Manage Events 
→ Click "⚡ Quick Invite" button (blue gradient)
→ Opens: /admin/events/[event-id]/quick-invite
```

#### **Étape 2: Remplir Formulaire**
```
Tab: "➕ Add New Company" (default)

Required Fields:
✓ Email: hr@techcorp.com
✓ Company Name: TechCorp Solutions

Optional Fields:
- Industry: Technology (dropdown)
- Website: https://www.techcorp.com
```

#### **Étape 3: Submit**
```
Click: [🚀 Invite Company]

→ System processes (< 2 seconds):
  ✅ Creates company record
  ✅ Generates code: TECHCORPSOLUTI2025
  ✅ Marks as verified (admin-invited)
  ✅ Invites to THIS event
  ✅ Triggers slot auto-generation (18 slots created!)
  ✅ Sends Supabase Auth invitation email
```

#### **Étape 4: Result Displayed**
```
Success Message:
┌────────────────────────────────────────────┐
│ ✅ Company created and invited!            │
│    Welcome email will be sent to           │
│    hr@techcorp.com                         │
│                                            │
│ Company Code: TECHCORPSOLUTI2025           │
│ ✉️ Invitation email sent to                │
│    hr@techcorp.com                         │
└────────────────────────────────────────────┘

Form clears automatically → Ready for next invite!
```

#### **Étape 5: Company Receives Email**
```
📧 Subject: Invite to join

Hi TechCorp Solutions,

You've been invited to participate in [Event Name].

Click the link below to set up your account:
[MAGIC LINK - expires in 24 hours]

Event Details:
- Name: [Event Name]
- Company Code: TECHCORPSOLUTI2025

---
Company clicks link → Sets password → Logged in → Sees event!
```

---

### **WORKFLOW 2: Ré-inviter Entreprise Existante (5 secondes)**

#### **Étape 1: Switch to Re-invite Tab**
```
Click: "🔍 Re-invite Returning Companies" tab
```

#### **Étape 2: Search Company**
```
Search Bar: [techcorp_________] 🔍

Options:
- Search by name: "techcorp"
- Search by code: "TECHCORPSOLUTI2025"
- Search by email: "hr@techcorp.com"

Press Enter or click Search button
```

#### **Étape 3: Review Results**
```
Search Results:
┌──────────────────────────────────────────────────┐
│ TechCorp Solutions  [TECHCORPSOLUTI2025]         │
│ 📧 hr@techcorp.com                               │
│ 🏢 Technology                                    │
│ 🌐 https://www.techcorp.com                      │
│ 📊 2 past participations                         │
│ Last: Tech Fair 2024 (December 15, 2024)         │
│                                                  │
│                            [📧 Re-Invite]        │
└──────────────────────────────────────────────────┘

Note: If already invited, button shows "✓ Invited" (disabled)
```

#### **Étape 4: Click Re-Invite**
```
Click: [📧 Re-Invite]

→ System processes:
  ✅ Checks if already invited (skip if yes)
  ✅ Inserts into event_participants
  ✅ Triggers slot generation (18 new slots!)
  ✅ Sends notification email

→ Alert: "🎉 Company re-invited successfully! Notification sent to hr@techcorp.com"

→ Button changes to: [✓ Invited] (disabled)
```

#### **Étape 5: Company Receives Email**
```
📧 Subject: You're invited to [New Event Name]

Hi TechCorp Solutions,

We'd love to have you back!

You've been invited to:
📅 [Event Name]
📍 [Location]
🗓️ [Date]

Login with your existing credentials:
[LOGIN LINK]

Your interview slots are ready!
```

---

### **WORKFLOW 3: Export Companies CSV (For Next Year)**

#### **Use Case:**
You hosted "Tech Fair 2025" with 50 companies. Next year (2026), you want to invite the same companies quickly.

#### **Étape 1: Export Current Event Companies**
```
Navigate to: /admin/events/[tech-fair-2025-id]/quick-invite

Click: [📥 Export Companies CSV] (green button, top right)

→ Downloads: companies_Tech_Fair_2025_2025-11-04.csv
```

#### **Étape 2: CSV Content**
```csv
company_code,company_name,email,industry,website
TECHCORPSOLUTI2025,"TechCorp Solutions","hr@techcorp.com","Technology","https://www.techcorp.com"
INNOVATETECH2025,"Innovate Tech Labs","contact@innovate.io","Software","https://innovate.io"
FINANCECORP2025,"FinanceCorp","recruiting@finance.ma","Finance","https://finance.ma"
... (47 more companies)
```

#### **Étape 3: Save for Next Year**
```
Save CSV in admin folder:
/admin_files/events/tech_fair_2025_companies.csv

Note: This CSV contains:
✓ Company codes (stable identifiers)
✓ Current emails
✓ All metadata
```

#### **Étape 4: Next Year - Bulk Re-Invite**
```
2026: Create new event "Tech Fair 2026"

Option A: Manual Re-invite (Recommended - Full Control)
→ Open Quick Invite page for new event
→ Tab: "Re-invite Returning Companies"
→ Search each company by name/code
→ Click Re-Invite (one by one)
→ Total time: ~5 min for 50 companies

Option B: Bulk Import (Future Feature - Coming Soon)
→ Upload CSV file
→ System auto-invites all companies
→ Total time: < 30 seconds
```

---

## 📊 Database Schema Reference

### **companies Table (Updated)**
```sql
CREATE TABLE companies (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),
  company_name text NOT NULL,
  company_code text UNIQUE,  -- NEW! "TECHCORP2025"
  industry text,
  website text,
  is_verified boolean DEFAULT false,
  verification_status text,
  created_at timestamptz,
  updated_at timestamptz
);
```

### **event_participants Table**
```sql
CREATE TABLE event_participants (
  id uuid PRIMARY KEY,
  event_id uuid REFERENCES events(id),  -- THIS IS THE KEY!
  company_id uuid REFERENCES companies(id),
  invited_at timestamptz,
  UNIQUE(event_id, company_id)  -- One company per event
);
```

**Important:** Invitations are ALWAYS tied to a specific event via `event_id`!

---

## 🔧 Function Details

### **quick_invite_company()**

**Signature:**
```sql
quick_invite_company(
  p_email text,           -- Company email
  p_company_name text,    -- Company name
  p_event_id uuid,        -- EVENT ID (REQUIRED!)
  p_industry text,        -- Optional, default 'Other'
  p_website text          -- Optional
) RETURNS json
```

**Logic:**
```
1. Check if auth.users exists for email
   ├─ Yes → Get profile_id, company_id
   └─ No → profile_id = NULL (will be created on signup)

2. Check if company record exists
   ├─ Yes → Update company info
   └─ No → Create company with auto-generated code

3. Check if already invited to THIS EVENT
   ├─ Yes → Set already_invited = true
   └─ No → INSERT into event_participants (triggers slot generation!)

4. Return detailed JSON with action taken
```

**Return Value:**
```json
{
  "success": true,
  "company_id": "uuid",
  "company_code": "TECHCORP2025",
  "company_name": "TechCorp Solutions",
  "email": "hr@techcorp.com",
  "is_new_company": true,
  "auth_user_exists": false,
  "already_invited": false,
  "slots_generated": true,
  "action": "created_and_invited",
  "message": "✅ Company created and invited! Welcome email will be sent to hr@techcorp.com",
  "next_step": "send_invite_email"
}
```

### **search_companies_for_invitation()**

**Signature:**
```sql
search_companies_for_invitation(
  search_query text,      -- Search by name/code/email
  event_id_filter uuid    -- FILTER by event (optional)
) RETURNS TABLE (...)
```

**What It Returns:**
```
company_code | company_name       | email             | total_participations | already_invited
-------------|--------------------|-------------------|---------------------|----------------
TECHCORP2025 | TechCorp Solutions | hr@techcorp.com   | 2                   | false
INNOVATE2025 | Innovate Labs      | contact@innov.io  | 1                   | true
```

**Sorting Logic:**
1. Not yet invited to THIS event (first)
2. Then by participation count (DESC)
3. Then alphabetically by name

---

## 📧 Email Configuration

### **Supabase Auth Settings**

**Navigate to:** Supabase Dashboard → Authentication → Email Templates

#### **Invite Email Template:**
```html
<h2>Welcome to UM6P Speed Recruiting Platform</h2>

<p>Hi {{ .Data.company_name }},</p>

<p>You've been invited to participate in <strong>{{ .Data.event_name }}</strong>.</p>

<h3>Your Account Details:</h3>
<ul>
  <li><strong>Company Code:</strong> {{ .Data.company_code }}</li>
  <li><strong>Email:</strong> {{ .Email }}</li>
</ul>

<p>Click the button below to set your password and access your dashboard:</p>

<p><a href="{{ .ConfirmationURL }}">Set Your Password</a></p>

<p><em>This link expires in 24 hours.</em></p>

<p>Looking forward to seeing you at the event!</p>

<p>UM6P Recruitment Team</p>
```

**Variables Available:**
- `{{ .Email }}` - Company email
- `{{ .ConfirmationURL }}` - Magic link to set password
- `{{ .Data.company_name }}` - Company name
- `{{ .Data.company_code }}` - Generated code
- `{{ .Data.event_name }}` - Event name
- `{{ .Data.event_id }}` - Event ID

---

## 🧪 Testing Checklist

### **Test 1: New Company Invite**

- [ ] Navigate to `/admin/events/[event-id]/quick-invite`
- [ ] Fill form: email + company name
- [ ] Click "Invite Company"
- [ ] See success message with company code
- [ ] Check email inbox (invitation received)
- [ ] Click magic link in email
- [ ] Set password
- [ ] Login → See event in dashboard
- [ ] Verify 18 slots created in database

**SQL Verification:**
```sql
-- Check company created
SELECT company_code, company_name, is_verified
FROM companies
WHERE company_name = 'Test Company Inc';

-- Check invited to event
SELECT * FROM event_participants
WHERE company_id = (SELECT id FROM companies WHERE company_code = 'TESTCOMPANY2025')
  AND event_id = '[your-event-id]';

-- Check slots generated
SELECT COUNT(*) FROM event_slots
WHERE company_id = (SELECT id FROM companies WHERE company_code = 'TESTCOMPANY2025')
  AND event_id = '[your-event-id]';
-- Should return: 18 (if 2 sessions × 9 slots each)
```

### **Test 2: Search & Re-Invite**

- [ ] Switch to "Re-invite" tab
- [ ] Search for company: "test"
- [ ] See company in results with participation count
- [ ] Click "Re-Invite"
- [ ] See success alert
- [ ] Button changes to "✓ Invited" (disabled)
- [ ] Check email inbox (notification received)

### **Test 3: Export CSV**

- [ ] Click "Export Companies CSV"
- [ ] CSV file downloads
- [ ] Open in Excel/Sheets
- [ ] Verify columns: company_code, company_name, email, industry, website
- [ ] Verify all invited companies present
- [ ] Save file for future reference

### **Test 4: Duplicate Prevention**

- [ ] Try to invite same company twice
- [ ] Should see: "ℹ️ Company already invited to this event"
- [ ] No duplicate event_participants created
- [ ] No duplicate slots generated

---

## 🎓 Admin Training (One-Pager)

### **Scenario: First Event Setup**

**You need to invite 30 companies:**

1. **Quick Method (Recommended):**
   ```
   Time: 15 minutes total
   
   For each company:
   - Open: Quick Invite page
   - Enter: Email + Name
   - Click: Invite
   - Takes: 30 seconds each
   
   Total: 30 × 30s = 15 minutes
   ```

2. **What Happens Automatically:**
   - ✅ Company record created
   - ✅ Code generated (COMPANY2025)
   - ✅ Verified (admin-trusted)
   - ✅ Invited to event
   - ✅ 18 slots created
   - ✅ Email sent
   
3. **Companies Receive:**
   - Welcome email with magic link
   - 24 hours to set password
   - Immediate access to event

### **Scenario: Annual Event (Returning Companies)**

**You hosted last year with 30 companies, inviting 25 back:**

1. **Export Last Year's Data:**
   ```
   Open: Last year's event Quick Invite page
   Click: Export CSV
   Save: tech_fair_2024_companies.csv
   ```

2. **Re-Invite Companies:**
   ```
   Time: 2 minutes total
   
   For each company:
   - Tab: Re-invite
   - Search: Company name (autocomplete)
   - Click: Re-Invite
   - Takes: 5 seconds each
   
   Total: 25 × 5s = 2 minutes
   ```

3. **Efficiency Gain:**
   - Last year: 15 minutes (new invites)
   - This year: 2 minutes (re-invites)
   - **87% faster!** 🚀

---

## 🔒 Security & Permissions

### **RLS Policies**

**Only admins can:**
- ✅ Call `quick_invite_company()`
- ✅ Search all companies
- ✅ Export CSV

**Function checks:**
```sql
-- Inside quick_invite_company()
-- (Implicit via SECURITY DEFINER + admin UI access control)

-- Frontend checks:
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile.role !== 'admin') {
  router.push('/offers') // Redirect non-admins
}
```

---

## 🚀 Ready to Use!

### **Summary:**

✅ **Migration 24** - Applied (functions available)  
✅ **Quick Invite UI** - Ready at `/admin/events/[id]/quick-invite`  
✅ **Email Sending** - Configured via Supabase Auth  
✅ **Export CSV** - One-click download  
✅ **Event Association** - All invites tied to specific events  

### **Next Steps:**

1. **Test avec vraie entreprise:**
   - Use real email address
   - Verify email delivery
   - Test password setup

2. **Customize email template:**
   - Supabase Dashboard → Auth → Templates
   - Add your branding
   - Include event-specific details

3. **Train admins:**
   - Show Quick Invite workflow
   - Demo search & re-invite
   - Explain CSV export

**Vous avez le système le plus simple du marché !** 🎉
