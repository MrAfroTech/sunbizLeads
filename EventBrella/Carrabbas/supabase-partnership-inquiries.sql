-- ============================================
-- Orlando Pirates x Seamlessly Partnership Inquiries
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS partnership_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  establishment_type TEXT NOT NULL,
  current_traffic TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_status ON partnership_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_created_at ON partnership_inquiries(created_at DESC);

-- Optional: RLS policies (adjust as needed for your auth setup)
-- ALTER TABLE partnership_inquiries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow anonymous insert" ON partnership_inquiries FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow service role full access" ON partnership_inquiries FOR ALL USING (auth.role() = 'service_role');
