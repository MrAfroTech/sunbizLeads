/** Multi-location operator types (10+ locations only) */

export type OperatorCategory =
  | 'stadium_arena'
  | 'casino'
  | 'theme_park'
  | 'university_dining'
  | 'airport_concessions'
  | 'restaurant_chain'
  | 'golf_management'
  | 'marina_group'
  | 'hotel_fb'
  | 'entertainment_venue';

export interface SunbizIndicators {
  entity_keywords?: string[];
  same_registered_agent?: boolean;
  dba_count?: number;
  raw?: Record<string, unknown>;
}

export interface ExpansionSignal {
  source: 'crunchbase' | 'sunbiz' | 'job_postings' | 'google_news';
  description: string;
  date?: string;
}

export interface MultiLocationOperator {
  id?: string;
  company_name: string;
  document_number?: string;
  category: OperatorCategory;
  estimated_location_count: number;
  location_count_source?: string;
  sunbiz_indicators?: SunbizIndicators;
  parent_company?: string;
  website?: string;
  hq_city?: string;
  hq_state?: string;
  pos_system?: string;
  pos_confidence?: string;
  expansion_signals?: ExpansionSignal[];
  expansion_score?: number;
  is_qualified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DecisionMaker {
  id?: string;
  company_id: string;
  full_name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  data_sources?: string[];
  email_confidence?: string;
  is_verified: boolean;
  synced_to_brevo: boolean;
  brevo_contact_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DecisionMakerFinderResult {
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface MultiLocationDetectorResult {
  company_name: string;
  location_count: number;
  category: OperatorCategory;
  confidence: 'high' | 'medium' | 'low';
}

export interface CategoryClassifierResult {
  category: OperatorCategory;
  confidence: 'high' | 'medium' | 'low';
}

export interface POSDetectorResult {
  pos_system: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExpansionDetectorResult {
  expansion_signals: ExpansionSignal[];
  expansion_score: number;
}

export interface CategoryConfig {
  name: OperatorCategory;
  enabled: boolean;
  sunbiz_keywords: string[];
  min_locations: number;
  decision_maker_titles: string[];
  priority: number;
}

export interface RunHistory {
  id?: string;
  run_date: string;
  multi_location_operators_found: number;
  decision_makers_found: number;
  categories_breakdown: Record<string, number>;
  avg_locations_per_operator?: number;
  expansion_signals_detected: number;
  errors: string[];
  cost_estimate_usd: number;
  duration_seconds: number;
  created_at?: string;
}
