/**
 * Stripe env mapping for Vercel (scan-and-scale project).
 *
 * Required for checkout:
 *   STRIPE_TEST_SECRET_KEY  — preview / test checkouts
 *   STRIPE_LIVE_SECRET_KEY  — production checkouts
 *
 * Optional:
 *   STRIPE_LIVE_PUBLISHABLE_KEY     — client Stripe.js (if added later)
 *   STRIPE_WEBHOOK_TEST_SECRET      — POST /api/stripe-webhook (test)
 *   STRIPE_WEBHOOK_LIVE_SECRET      — POST /api/stripe-webhook (live)
 *   REACT_APP_STRIPE_REDIRECT_URI   — Connect OAuth callback
 *   REACT_APP_STRIPE_SCOPE          — Connect OAuth scope (default read_write)
 *
 * Mode selection (first match wins):
 *   REACT_APP_STRIPE_ENVIRONMENT=test|production
 *   STRIPE_TEST_MODE / TEST_MODE
 *   VERCEL_ENV=production → live; preview|development → test
 */

const Stripe = require('stripe');

function parseBool(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return null;
  }
  const s = String(raw).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;
  return null;
}

function isStripeTestMode() {
  if (process.env.REACT_APP_STRIPE_ENVIRONMENT === 'test') return true;
  if (process.env.REACT_APP_STRIPE_ENVIRONMENT === 'production') return false;

  const explicit = parseBool(
    process.env.STRIPE_TEST_MODE ??
      process.env.STRIPE_USE_TEST_MODE ??
      process.env.TEST_MODE
  );
  if (explicit !== null) return explicit;

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return false;
  if (vercelEnv === 'preview' || vercelEnv === 'development') return true;

  if (process.env.NODE_ENV === 'production') return false;
  return true;
}

function getStripeSecretKey() {
  const testMode = isStripeTestMode();
  if (testMode) {
    return (
      process.env.STRIPE_TEST_SECRET_KEY?.trim() ||
      process.env.STRIPE_SECRET_KEY?.trim() ||
      ''
    );
  }
  return (
    process.env.STRIPE_LIVE_SECRET_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    ''
  );
}

function getStripePublishableKey() {
  const testMode = isStripeTestMode();
  if (testMode) {
    return (
      process.env.STRIPE_TEST_PUBLISHABLE_KEY?.trim() ||
      process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY?.trim() ||
      ''
    );
  }
  return (
    process.env.STRIPE_LIVE_PUBLISHABLE_KEY?.trim() ||
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

function getStripeWebhookSecret() {
  const testMode = isStripeTestMode();
  if (testMode) {
    return (
      process.env.STRIPE_WEBHOOK_TEST_SECRET?.trim() ||
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      ''
    );
  }
  return (
    process.env.STRIPE_WEBHOOK_LIVE_SECRET?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    ''
  );
}

function getStripeOAuthRedirectUri() {
  return (
    process.env.REACT_APP_STRIPE_REDIRECT_URI?.trim() ||
    process.env.STRIPE_REDIRECT_URI?.trim() ||
    ''
  );
}

function getStripeOAuthScope() {
  return (
    process.env.REACT_APP_STRIPE_SCOPE?.trim() ||
    process.env.STRIPE_SCOPE?.trim() ||
    'read_write'
  );
}

function getStripeModeLabel() {
  return isStripeTestMode() ? 'test' : 'live';
}

function getRequiredSecretEnvName() {
  return isStripeTestMode()
    ? 'STRIPE_TEST_SECRET_KEY'
    : 'STRIPE_LIVE_SECRET_KEY';
}

const secretKey = getStripeSecretKey();
const stripe = secretKey ? new Stripe(secretKey) : null;

module.exports = {
  stripe,
  isStripeTestMode,
  getStripeSecretKey,
  getStripePublishableKey,
  getStripeWebhookSecret,
  getStripeOAuthRedirectUri,
  getStripeOAuthScope,
  getStripeModeLabel,
  getRequiredSecretEnvName,
};
