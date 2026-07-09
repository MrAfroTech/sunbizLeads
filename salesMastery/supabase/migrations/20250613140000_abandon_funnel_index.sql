-- Index for calculator abandonment email cohort queries (engine_version v2_abandon).
CREATE INDEX IF NOT EXISTS idx_scan_and_scale_click_events_abandon_followup
  ON public.scan_and_scale_click_events (engine_version, emails_sent, created_at ASC)
  WHERE engine_version = 'v2_abandon';

COMMENT ON INDEX public.idx_scan_and_scale_click_events_abandon_followup IS
  'Daily cron: send-calculator-abandon-emails (templates 195–198).';
