-- Calculator personalization fields for Brevo {{ contact.* }} merge tags.
ALTER TABLE public.scan_and_scale_click_events
  ADD COLUMN IF NOT EXISTS estimated_loss text,
  ADD COLUMN IF NOT EXISTS avg_wait_time text,
  ADD COLUMN IF NOT EXISTS primary_friction_zone text;

COMMENT ON COLUMN public.scan_and_scale_click_events.estimated_loss IS
  'Formatted estimated revenue loss from calculator (e.g. $12,400). Source of truth for email personalization.';
COMMENT ON COLUMN public.scan_and_scale_click_events.avg_wait_time IS
  'Representative wait-time benchmark from calculator context (e.g. 10 minutes).';
COMMENT ON COLUMN public.scan_and_scale_click_events.primary_friction_zone IS
  'Highest-impact friction point label from calculator results.';
