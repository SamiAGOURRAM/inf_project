export type UserRole = 'student' | 'company' | 'admin';

export type EventConfig = {
  id: number;
  event_date: string;
  phase1_start: string;
  phase1_end: string;
  phase2_start: string;
  phase2_end: string;
  current_phase: number;
  phase1_booking_limit: number;
  phase2_booking_limit: number;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_deprioritized: boolean;
  created_at: string;
};

export type Company = {
  id: string;
  profile_id: string;
  company_name: string;
  industry?: string;
  description?: string;
  website?: string;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
};

export type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string;
  is_active: boolean;
  created_at: string;
};

export type Offer = {
  id: string;
  company_id: string;
  event_id: string;
  title: string;
  description: string;
  interest_tag: 'Opérationnel' | 'Administratif';
  is_active: boolean;
  created_at: string;
};

export type EventSlot = {
  id: string;
  event_id: string;
  company_id: string;
  offer_id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_booked: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  slot_id: string;
  student_id: string;
  status: 'confirmed' | 'cancelled';
  booking_phase: number;
  created_at: string;
  cancelled_at?: string;
};

export type SlotWithDetails = EventSlot & {
  company: Company;
  offer: Offer;
};

export type BookingWithDetails = Booking & {
  slot: SlotWithDetails;
};

export type StatsResponse = {
  current_bookings: number;
  max_bookings: number;
  remaining_bookings: number;
};