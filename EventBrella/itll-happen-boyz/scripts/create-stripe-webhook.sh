#!/usr/bin/env bash
# Create Stripe webhook for this client. Part of white-label template.
# Usage: ./scripts/create-stripe-webhook.sh [BASE_URL] [--live]
# Example: ./scripts/create-stripe-webhook.sh https://acme-farm.eventbrella.us
#
# All other Stripe env vars are client-agnostic — copy from FarmerBanks.
# The ONLY new Stripe variable for this client is the webhook signing secret.

set -e
BASE_URL="${1:-}"
LIVE_MODE=false
[ "${2:-}" = "--live" ] && LIVE_MODE=true

if [ -z "$BASE_URL" ]; then
  echo "Usage: $0 BASE_URL [--live]"
  echo "Example: $0 https://acme-farm.eventbrella.us"
  exit 1
fi

WEBHOOK_URL="${BASE_URL%/}/api/stripe-webhook"
echo "Creating webhook: $WEBHOOK_URL"
echo ""

if ! command -v stripe >/dev/null 2>&1; then
  echo "Stripe CLI not found. Install: https://stripe.com/docs/stripe-cli"
  exit 1
fi

if [ "$LIVE_MODE" = true ]; then
  OUT=$(stripe webhook_endpoints create --url "$WEBHOOK_URL" --enabled-events checkout.session.completed --live 2>&1)
else
  OUT=$(stripe webhook_endpoints create --url "$WEBHOOK_URL" --enabled-events checkout.session.completed 2>&1)
fi

echo "$OUT"
SECRET=$(echo "$OUT" | grep -o 'whsec_[a-zA-Z0-9]*' | head -1)
echo ""
if [ -n "$SECRET" ]; then
  echo "--- Add to Vercel (only new Stripe var for this client) ---"
  [ "$LIVE_MODE" = true ] && echo "STRIPE_WEBHOOK_LIVE_SECRET=$SECRET" || echo "STRIPE_WEBHOOK_TEST_SECRET=$SECRET"
  echo "Copy from FarmerBanks: STRIPE_TEST_SECRET_KEY, STRIPE_LIVE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, TEST_MODE"
else
  echo "Get signing secret from Stripe Dashboard → Developers → Webhooks → new endpoint."
fi
