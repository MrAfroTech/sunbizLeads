import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
    }
    client = createClient(config.supabase.url, config.supabase.serviceKey);
  }
  return client;
}

export type Tables = {
  multi_location_operators: {
    id: string;
    company_name: string;
    document_number: string | null;
    category: string;
    estimated_location_count: number;
    location_count_source: string | null;
    sunbiz_indicators: Record<string, unknown> | null;
    parent_company: string | null;
    website: string | null;
    hq_city: string | null;
    hq_state: string | null;
    pos_system: string | null;
    pos_confidence: string | null;
    expansion_signals: unknown[] | null;
    expansion_score: number | null;
    is_qualified: boolean;
    created_at: string;
    updated_at: string;
  };
  decision_makers: {
    id: string;
    company_id: string;
    full_name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    linkedin_url: string | null;
    data_sources: string[] | null;
    email_confidence: string | null;
    is_verified: boolean;
    synced_to_brevo: boolean;
    brevo_contact_id: number | null;
    created_at: string;
    updated_at: string;
  };
  run_history: {
    id: string;
    run_date: string;
    multi_location_operators_found: number;
    decision_makers_found: number;
    categories_breakdown: Record<string, number> | null;
    avg_locations_per_operator: number | null;
    expansion_signals_detected: number;
    errors: unknown;
    cost_estimate_usd: number;
    duration_seconds: number;
    created_at: string;
  };
};
