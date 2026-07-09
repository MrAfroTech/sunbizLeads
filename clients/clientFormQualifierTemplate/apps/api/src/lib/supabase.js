import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

export function createSupabaseAdmin() {
  const url = getEnv('SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

