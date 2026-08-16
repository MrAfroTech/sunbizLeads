// api/runtime-env.js — Staging/Preview vs Production detection using existing Vercel + mode env vars
const { resolveEventIsTestMode, getStripeSecretKey, getWebhookSigningSecret } = require('./event-mode');

/**
 * Staging runtime = Vercel Preview deployments and/or the `staging` git branch.
 * Uses Vercel-injected env vars (VERCEL_ENV, VERCEL_GIT_COMMIT_REF) already present
 * on Preview/Production — no new custom detection flag.
 *
 * Production (VERCEL_ENV=production / main) returns false.
 */
function isStagingRuntime() {
  const ref = String(process.env.VERCEL_GIT_COMMIT_REF || '').trim();
  if (ref === 'staging') return true;

  const vercelEnv = String(process.env.VERCEL_ENV || '').toLowerCase();
  if (vercelEnv === 'preview') return true;

  return false;
}

/**
 * Resolve whether Stripe should use TEST keys.
 * Staging/Preview always forces test mode. Production keeps existing lounge/event logic.
 */
function resolveIsStripeTestMode({ eventId, eventDate, eventName, tier, bodyIsTestMode } = {}) {
  if (isStagingRuntime()) return true;

  let isTestMode = resolveEventIsTestMode({ eventId, eventDate, eventName });
  if (String(tier || '').startsWith('lounge_') && process.env.SOCIAL_LOUNGE_IS_TEST_MODE != null) {
    isTestMode = String(process.env.SOCIAL_LOUNGE_IS_TEST_MODE).toLowerCase() !== 'false';
  } else if (typeof bodyIsTestMode === 'boolean') {
    isTestMode = bodyIsTestMode;
  }
  return isTestMode;
}

/** Production table name → staging `stage_`-prefixed name when on Preview/staging. */
function dbTable(baseName) {
  if (!isStagingRuntime()) return baseName;
  return `stage_${baseName}`;
}

module.exports = {
  isStagingRuntime,
  resolveIsStripeTestMode,
  getStripeSecretKey,
  getWebhookSigningSecret,
  dbTable
};
