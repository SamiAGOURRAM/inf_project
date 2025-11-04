import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iwsrbinrafpexyarjdew.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3c3JiaW5yYWZwZXh5YXJqZGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDY4OTYsImV4cCI6MjA3NzU4Mjg5Nn0.8VB8ueq3-po12Eko6wwMfKH7YX2_LYzdelwrVO6-DsE';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});