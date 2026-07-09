import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** Browser client — publishable (anon) key only. Table access depends on RLS policies or GRANTs. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}
