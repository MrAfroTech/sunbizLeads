import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { requireEnv } from './env.ts';

export function createAdminClient () {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
