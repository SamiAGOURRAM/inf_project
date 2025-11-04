# INF Platform 2.0 - Setup Instructions

## Quick Setup Guide

### 1. Setup Supabase Project

1. Go to https://supabase.com and create a new project
2. Wait for the project to be ready
3. Go to SQL Editor
4. Run the migrations in order:
   - Copy/paste `/supabase/migrations/20251101000001_initial_schema.sql`
   - Copy/paste `/supabase/migrations/20251101000002_core_functions.sql`
5. Get your credentials:
   - Go to Project Settings → API
   - Copy `Project URL` and `anon public` key

### 2. Configure Frontend

1. Update `/frontend/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Initial Event Config

In Supabase SQL Editor, run:
```sql
INSERT INTO event_config (
  id,
  event_date,
  phase1_start,
  phase1_end,
  phase2_start,
  phase2_end,
  current_phase,
  phase1_booking_limit,
  phase2_booking_limit
) VALUES (
  1,
  '2025-11-20',
  '2025-11-18 09:00:00+00',
  '2025-11-19 23:59:59+00',
  '2025-11-20 00:00:00+00',
  '2025-11-20 17:00:00+00',
  0, -- Not open yet
  3, -- Phase 1 limit
  6  -- Phase 2 limit
);
```

### 4. Create Admin User

In Supabase SQL Editor:
```sql
-- 1. Create auth user (via Supabase Dashboard → Authentication → Users → Add User)
--    Email: admin@inf.com
--    Password: (set a secure password)
--    After creating, get the user ID

-- 2. Insert profile
INSERT INTO profiles (id, email, full_name, role, is_deprioritized)
VALUES (
  'USER_ID_FROM_STEP_1', -- Replace with actual UUID
  'admin@inf.com',
  'Admin User',
  'admin',
  false
);
```

### 5. Run the Application

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## Test Flow

### 1. Create Test Student (Non-deprioritized)
- Go to http://localhost:3000/signup
- Select "Student"
- Fill in details
- **DO NOT** check "I already have an internship"
- Create account

### 2. Create Test Student (Deprioritized)
- Signup again
- This time **CHECK** "I already have an internship"
- This student cannot book in Phase 1

### 3. Create Test Company
- Signup as "Company"
- Fill company details
- Login as admin
- Verify the company in Admin Dashboard → Companies tab

### 4. Create Offers (as Company)
You'll need to create a company dashboard for this, or do it via SQL:
```sql
INSERT INTO offers (company_id, title, description, interest_tag)
VALUES (
  'COMPANY_ID_HERE',
  'Backend Developer Internship',
  'Work on exciting backend projects',
  'Opérationnel'
);
```

### 5. Generate Slots (Admin Function)
Run via SQL or create admin UI:
```sql
SELECT fn_generate_event_slots(
  'COMPANY_ID_HERE',
  'OFFER_ID_HERE'
);
```

### 6. Open Phase 1
- Login as admin
- Admin Dashboard → Event Config
- Set "Current Phase" to 1
- Save

### 7. Test Booking
- Login as non-deprioritized student
- See available slots
- Click "Book"
- Should succeed

- Login as deprioritized student  
- Try to book
- Should FAIL with "Phase 1 is reserved for students without internships"

### 8. Open Phase 2
- Admin: Set phase to 2
- Now deprioritized students CAN book

## Features Implemented

✅ User Authentication (Supabase Auth)
✅ Role-based access (Student, Company, Admin)
✅ Student Signup with **is_deprioritized** flag
✅ Company verification workflow
✅ Event configuration management
✅ Slot booking with atomicity (fn_book_interview)
✅ Phase 1 gate enforcement
✅ Booking limits (3 for Phase 1, 6 for Phase 2)
✅ Booking cancellation
✅ Real-time stats
✅ Audit trail (booking_attempts table)

## Next Steps

1. **Company Dashboard**: Create/manage offers, view bookings
2. **Admin**: Slot generation UI
3. **Better UI**: Polish the interface
4. **Email Notifications**: On booking/cancellation
5. **Export**: Download booking lists for companies

## Database Functions Available

- `fn_book_interview(slot_id)` - Book a slot
- `fn_cancel_booking(booking_id)` - Cancel a booking
- `fn_get_student_booking_stats(student_id)` - Get booking stats
- `fn_generate_event_slots(company_id, offer_id)` - Generate slots
- `fn_verify_company(company_id, verified)` - Verify company

## Architecture

- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **Critical Logic**: PostgreSQL functions (atomic, secure)
- **Security**: Row Level Security (RLS) + SECURITY DEFINER functions
