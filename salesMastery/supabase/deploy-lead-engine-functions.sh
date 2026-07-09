#!/usr/bin/env bash
# Deploy unified lead engine Edge Functions.
# Must run from this directory (salesMastery/supabase) — not seamlesslyUs/supabase.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [[ ! -f "functions/on-lead-submit/index.ts" ]]; then
  echo "error: functions/on-lead-submit/index.ts not found."
  echo "Run this script from salesMastery/supabase (not SeamlessVendorUI/seamlesslyUs/supabase)."
  exit 1
fi

echo "Deploying from: $ROOT"
echo "Project: $(grep '^project_id' config.toml | cut -d= -f2 | tr -d ' \"')"

supabase functions deploy ingest-lead-event --no-verify-jwt
supabase functions deploy on-lead-submit --no-verify-jwt
supabase functions deploy score-lead
supabase functions deploy send-followup-emails
supabase functions deploy send-calculator-abandon-emails
supabase functions deploy daily-org-funnel-snapshot --no-verify-jwt
supabase functions deploy purge-test-leads

echo "Done."
