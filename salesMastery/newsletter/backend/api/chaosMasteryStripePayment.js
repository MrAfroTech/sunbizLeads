// Chaos Mastery preorder — Stripe Hosted Checkout (checkout.stripe.com).
// Client redirects to session.url; no custom card form.
console.log('🔧 Chaos Mastery Stripe payment function loaded');

function resolveStripeSecretKey() {
  return (
    process.env.STRIPE_TEST_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_LIVE_SECRET_KEY ||
    ''
  );
}

const stripeSecretKey = resolveStripeSecretKey();
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;
const { v4: uuidv4 } = require('uuid');

console.log('🔧 Stripe initialized:', {
  hasStripe: !!stripe,
  hasKey: !!stripeSecretKey,
});

const PRODUCT_NAME =
  'Chaos Mastery: Seamless Hospitality for the 21st Century — Preorder';
const UNIT_AMOUNT_CENTS = 2299;

const SUCCESS_URL =
  'https://newsletter.seamlessly.us/chaos-mastery-checkout?session_id={CHECKOUT_SESSION_ID}';
const CANCEL_URL = 'https://newsletter.seamlessly.us/chaos-mastery-checkout';

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
          'Payment service not configured. Set STRIPE_TEST_SECRET_KEY, STRIPE_SECRET_KEY, or STRIPE_LIVE_SECRET_KEY in the Vercel project environment variables.',
      });
    }

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
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
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
