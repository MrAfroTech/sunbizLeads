// Chaos Mastery preorder — Stripe Hosted Checkout (checkout.stripe.com).
// Client redirects to session.url; no custom card form.
console.log('🔧 Chaos Mastery Stripe payment function loaded');

/**
 * STRIPE_TEST_MODE / STRIPE_USE_TEST_MODE / TEST_MODE / test_mode
 * — "true" | "1" | "yes" | "on"  → use STRIPE_TEST_SECRET_KEY (Stripe test / Checkout test mode)
 * — "false" | "0" | "no" | "off" → use STRIPE_LIVE_SECRET_KEY (live Checkout)
 * — unset → default true (test keys first), backward compatible with older deploys
 */
function useStripeTestMode() {
  const raw =
    process.env.STRIPE_TEST_MODE ??
    process.env.STRIPE_USE_TEST_MODE ??
    process.env.TEST_MODE ??
    process.env.test_mode;
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return true;
  }
  const s = String(raw).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;
  return true;
}

function resolveStripeSecretKey() {
  const testMode = useStripeTestMode();
  if (testMode) {
    return (
      process.env.STRIPE_TEST_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_LIVE_SECRET_KEY ||
      ''
    );
  }
  return (
    process.env.STRIPE_LIVE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_TEST_SECRET_KEY ||
    ''
  );
}

function originFromRequest(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https')
    .split(',')[0]
    .trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim();
  if (!host) return 'https://localhost';
  return `${proto}://${host}`;
}

const stripeSecretKey = resolveStripeSecretKey();
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;
const { v4: uuidv4 } = require('uuid');

console.log('🔧 Stripe initialized:', {
  hasStripe: !!stripe,
  hasKey: !!stripeSecretKey,
  stripeTestModeFlag: useStripeTestMode(),
});

const PRODUCT_NAME =
  'Chaos Mastery: Seamless Hospitality for the 21st Century — Preorder';
const UNIT_AMOUNT_CENTS = 2700;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS' || req.method?.toUpperCase() === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Only POST requests are accepted.',
      allowedMethods: ['POST', 'OPTIONS'],
    });
  }

  console.log('💳 Chaos Mastery Stripe payment called:', {
    method: req.method,
    url: req.url,
    host: req.headers.host,
    forwardedHost: req.headers['x-forwarded-host'],
  });

  try {
    const transactionId = `TXN_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

    if (!stripe) {
      console.error('❌ Stripe not initialized - missing secret key');
      return res.status(500).json({
        success: false,
        message:
          'Payment service not configured. Set STRIPE_TEST_MODE (true/false) and STRIPE_TEST_SECRET_KEY / STRIPE_LIVE_SECRET_KEY (or STRIPE_SECRET_KEY) in the Vercel project environment variables.',
      });
    }

    const origin = originFromRequest(req);
    const success_url = `${origin}/chaos-mastery-checkout?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}/chaos-mastery-checkout`;

    const session = await stripe.checkout.sessions.create({
      // Guest checkout only — do not pass `customer` or `customer_email` (no Stripe Customer pre-attached).
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: PRODUCT_NAME,
            },
            unit_amount: UNIT_AMOUNT_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url,
      cancel_url,
      metadata: {
        transaction_id: transactionId,
        product: 'chaos_mastery_hardcover_preorder',
      },
    });

    console.log('✅ Checkout session created:', {
      sessionId: session.id,
      transactionId,
    });

    return res.status(200).json({
      success: true,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error('❌ Stripe Checkout API error:', error);

    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: 'Card declined',
        error: error.message,
      });
    }
    if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: error.message,
      });
    }
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        error: error.message,
      });
    }
    if (error.type === 'StripeAPIError') {
      return res.status(500).json({
        success: false,
        message: 'Stripe API error',
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
