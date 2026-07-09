#!/usr/bin/env bash
# Copy client-agnostic Stripe vars from FarmerBanks .env and add them (plus new webhook
# secret) to the new client's Vercel project via Vercel CLI. Run after new client codebase
# is created. Form has no effect on these variables — this script does.
#
# Usage: from new client dir: ./scripts/setup-vercel-stripe-env.sh [BASE_URL]
# Example: ./scripts/setup-vercel-stripe-env.sh https://new-client.eventbrella.us
#
# Requires: FarmerBanks .env at ../farmerBanks/.env, stripe CLI, vercel CLI.
# Run from new client directory. Run 'vercel link' there first if the project is not yet linked.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$(cd "$(dirname "$SCRIPT_DIR")" && pwd)"
BASE_URL="${1:-}"
FARMER_BANKS_ENV="${CLIENT_DIR}/../farmerBanks/.env"

if [ -z "$BASE_URL" ]; then
  echo "Usage: $0 BASE_URL"
  echo "Example: $0 https://new-client.eventbrella.us"
  echo "Run from new client directory. Copies Stripe vars from ../farmerBanks/.env and adds to Vercel."
  exit 1
fi

if [ ! -f "$FARMER_BANKS_ENV" ]; then
  echo "Error: FarmerBanks .env not found at $FARMER_BANKS_ENV"
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Error: Vercel CLI not found. Install: npm i -g vercel"
  exit 1
fi

echo "Using FarmerBanks .env: $FARMER_BANKS_ENV"
echo "New client dir: $CLIENT_DIR"
echo "Base URL: $BASE_URL"
echo ""

# Parse FarmerBanks .env for Stripe and TEST_MODE (no comments, strip export)
get_var() {
  local name="$1"
  grep -E "^${name}=" "$FARMER_BANKS_ENV" 2>/dev/null | cut -d= -f2- | head -1
}

add_to_vercel() {
  local name="$1"
  local value="$2"
  local envs="${3:-production preview}"
  [ -z "$value" ] && return
  for env in $envs; do
    printf '%s' "$value" | vercel env add "$name" "$env" 2>/dev/null || true
  done
}

# 1) Create webhook for this client (test mode); get new signing secret
WEBHOOK_SCRIPT="$SCRIPT_DIR/create-stripe-webhook.sh"
if [ -x "$WEBHOOK_SCRIPT" ]; then
  echo "Creating Stripe webhook for $BASE_URL (test mode)..."
  WEBHOOK_OUT=$("$WEBHOOK_SCRIPT" "$BASE_URL" 2>&1) || true
  NEW_WEBHOOK_SECRET=$(echo "$WEBHOOK_OUT" | grep -o 'whsec_[a-zA-Z0-9]*' | head -1)
  echo "Webhook created. New secret: ${NEW_WEBHOOK_SECRET:+<set>}"
else
  echo "Warning: $WEBHOOK_SCRIPT not executable. Skipping webhook creation."
  NEW_WEBHOOK_SECRET=""
fi

# 2) Copy client-agnostic vars from FarmerBanks; new client is test mode
STRIPE_TEST_SECRET_KEY=$(get_var "STRIPE_TEST_SECRET_KEY")
STRIPE_LIVE_SECRET_KEY=$(get_var "STRIPE_LIVE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY=$(get_var "STRIPE_PUBLISHABLE_KEY")
[ -z "$STRIPE_PUBLISHABLE_KEY" ] && STRIPE_PUBLISHABLE_KEY=$(get_var "STRIPE_LIVE_PUBLISHABLE_KEY")
TEST_MODE="true"
TURNSTILE_SITE_KEY=$(get_var "TURNSTILE_SITE_KEY")
TURNSTILE_SECRET_KEY=$(get_var "TURNSTILE_SECRET_KEY")

# 3) Add to Vercel from new client directory
cd "$CLIENT_DIR"
echo "Adding Stripe + Turnstile env vars to Vercel project (production + preview)..."

add_to_vercel "STRIPE_TEST_SECRET_KEY" "$STRIPE_TEST_SECRET_KEY"
add_to_vercel "STRIPE_LIVE_SECRET_KEY" "$STRIPE_LIVE_SECRET_KEY"
add_to_vercel "STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY"
add_to_vercel "TEST_MODE" "$TEST_MODE"
add_to_vercel "STRIPE_WEBHOOK_TEST_SECRET" "$NEW_WEBHOOK_SECRET"
add_to_vercel "TURNSTILE_SITE_KEY" "$TURNSTILE_SITE_KEY"
add_to_vercel "TURNSTILE_SECRET_KEY" "$TURNSTILE_SECRET_KEY"
# Leave STRIPE_WEBHOOK_LIVE_SECRET for when client goes live (add manually or run with --live later)

echo "Done. Stripe, Turnstile (from FarmerBanks .env), and new webhook secret added to Vercel."
echo "Checkout: ensure Turnstile widget + backend verify per ../farmerBanks/CLOUDFLARE_TURNSTILE_INTEGRATION.md"
