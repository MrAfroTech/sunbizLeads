import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for journey tables + brevo_contacts click updates.
 * Order: SALES_MASTERY-prefixed (legacy), then generic VITE_/REACT_APP_ (same as playwrightAutomation/scripts/.env).
 */
const salesMasteryUrl =
  process.env.VITE_SUPABASE_URL_SALES_MASTERY ||
  process.env.REACT_APP_SUPABASE_URL_SALES_MASTERY ||
  process.env.VITE_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL;

const salesMasteryAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY_SALES_MASTERY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

/** Null when env vars are missing (local dev without .env.local). */
export const supabase =
  salesMasteryUrl && salesMasteryAnonKey
    ? createClient(salesMasteryUrl, salesMasteryAnonKey)
    : null;
