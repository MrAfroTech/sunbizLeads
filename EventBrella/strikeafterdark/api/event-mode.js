// api/event-mode.js — Per-event Stripe test/live mode (defaults to test)
const fs = require('fs');
const path = require('path');

/**
 * Parse event definitions from public/js/allevents.js
 * New events default to isTestMode: true when the flag is omitted.
 */
function loadRawEvents() {
  const alleventsPath = path.join(__dirname, '../public/js/allevents.js');
  const content = fs.readFileSync(alleventsPath, 'utf8');

  const monthlyMatch = content.match(/const MONTHLY_HARVEST_EVENTS = (\[[\s\S]*?\]);/);
  const specialMatch = content.match(/const SPECIAL_EVENTS = (\[[\s\S]*?\]);/);

  const monthly = monthlyMatch ? eval(monthlyMatch[1]) : [];
  const special = specialMatch ? eval(specialMatch[1]) : [];
  return [...monthly, ...special];
}

/**
 * Resolve whether an event should use Stripe TEST keys.
 * Defaults to true (test) when the event is unknown or the flag is omitted.
 */
function resolveEventIsTestMode({ eventId, eventDate, eventName } = {}) {
  try {
    const events = loadRawEvents();
    let match = null;

    if (eventId) {
      match = events.find((e) => e.id === eventId);
    }
    if (!match && eventDate) {
      match = events.find((e) => {
        if (e.date !== eventDate) return false;
        if (!eventName) return true;
        return String(e.name || '').toLowerCase() === String(eventName).toLowerCase();
      });
    }

    if (!match) {
      return true;
    }

    if (typeof match.isTestMode === 'boolean') {
      return match.isTestMode;
    }
    if (typeof match.is_test_mode === 'boolean') {
      return match.is_test_mode;
    }
    return true;
  } catch (err) {
    console.warn('⚠️ resolveEventIsTestMode fallback to test:', err.message);
    return true;
  }
}

function getStripeSecretKey(isTestMode) {
  if (isTestMode) {
    return process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY || null;
  }
  return process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || null;
}

function getWebhookSigningSecret(livemode) {
  // livemode true = live Stripe event → live webhook secret
  if (livemode === true) {
    return process.env.STRIPE_WEBHOOK_LIVE_SECRET || process.env.STRIPE_WEBHOOK_SECRET || null;
  }
  return process.env.STRIPE_WEBHOOK_TEST_SECRET || process.env.STRIPE_WEBHOOK_SECRET || null;
}

module.exports = {
  loadRawEvents,
  resolveEventIsTestMode,
  getStripeSecretKey,
  getWebhookSigningSecret
};
