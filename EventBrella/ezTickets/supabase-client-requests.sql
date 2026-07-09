-- ============================================
-- ezTickets: client_ticket_requests (Supabase/PostgreSQL)
-- ============================================
-- Run this SQL in Supabase SQL Editor.
-- Stores form submissions from white-label-form.html for automated processing.
-- ============================================

CREATE TABLE IF NOT EXISTS client_ticket_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity & Branding (form section 1)
  client_name TEXT,
  client_organizer_name TEXT,
  client_event_name TEXT,
  client_event_date DATE,
  client_event_start_time TEXT,
  client_event_end_time TEXT,
  client_event_time TEXT,
  client_event_description TEXT,
  client_app_name TEXT,
  client_event_type_label TEXT,
  client_event_date_time TEXT,

  -- Venue & Location (form section 2)
  client_venue_name TEXT,
  client_address_line1 TEXT,
  client_address_line2 TEXT,
  client_phone TEXT,
  client_google_maps_destination TEXT,
  client_google_maps_embed_url TEXT,

  -- Contact & Web (form section 3)
  client_website_url TEXT,
  client_contact_email TEXT,

  -- Ticketing Tiers (form section 4) — dynamic tier data
  ticketing_tiers JSONB DEFAULT '[]',

  -- Images (form section 5)
  organizer_image_file_name TEXT,
  hero_background_image_file_name TEXT,
  event_poster_image_file_name TEXT,
  hero_left_image_file_name TEXT,
  hero_right_image_file_name TEXT,
  client_organizer_image_url TEXT,
  client_hero_background_image TEXT,
  client_event_poster_image_url TEXT,
  client_hero_image_left TEXT,
  client_hero_image_right TEXT,

  -- Processing & status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_directory_path TEXT,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  agent_output TEXT  -- stdout/stderr from Cursor Agent CLI (or processing log)
);

-- Indexes for automation and dashboards
CREATE INDEX IF NOT EXISTS idx_client_ticket_requests_status ON client_ticket_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_ticket_requests_created_at ON client_ticket_requests(created_at DESC);

-- RLS: allow form (anon) to insert; service role used by automation has full access by default
ALTER TABLE client_ticket_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert client_ticket_requests" ON client_ticket_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON client_ticket_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- Migration: add agent_output (run if table already existed)
-- ============================================
-- ALTER TABLE client_ticket_requests ADD COLUMN IF NOT EXISTS agent_output TEXT;

-- ============================================
-- Verification (run after creating table)
-- ============================================
-- SELECT * FROM client_ticket_requests ORDER BY created_at DESC LIMIT 5;
