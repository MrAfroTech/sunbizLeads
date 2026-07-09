const {
  CALCULATOR_PLUS_PRICE,
  resolveCalculatorPlusStripePriceId,
} = require('../config/stripeConstants');

const IS_TEST_MODE =
  process.env.TEST_MODE === 'true' ||
  process.env.REACT_APP_STRIPE_ENVIRONMENT === 'test';

const STRIPE_SECRET_KEY = IS_TEST_MODE
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_LIVE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  const host = req.headers.host || req.headers['x-forwarded-host'];
  if (host) return `https://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://www.seamlessly.us';
}

function buildSuccessUrl(baseUrl, params) {
  const qs = new URLSearchParams({
    venue_type: params.venueType,
    daily_covers: String(params.dailyCovers),
    avg_order_value: String(params.avgOrderValue),
    missed_revenue: String(params.missedRevenue),
  });
  return `${baseUrl}/calculator-plus?session_id={CHECKOUT_SESSION_ID}&${qs.toString()}`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Requested-With, Accept'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  if (!stripe) {
    res.status(500).json({
      success: false,
      message: 'Payment service not configured. Missing Stripe secret key.',
    });
    return;
  }

  const {
    venueType = 'Stadium',
    dailyCovers = 0,
    avgOrderValue = 0,
    missedRevenue = 0,
    customerEmail,
  } = req.body || {};

  const baseUrl = getBaseUrl(req);
  const successUrl = buildSuccessUrl(baseUrl, {
    venueType,
    dailyCovers,
    avgOrderValue,
    missedRevenue,
  });
  const cancelUrl = `${baseUrl}/calculator/sports`;

  const configuredPriceId = resolveCalculatorPlusStripePriceId();
  const lineItem = configuredPriceId
    ? { price: configuredPriceId, quantity: 1 }
    : {
        price_data: {
          currency: CALCULATOR_PLUS_PRICE.currency,
          unit_amount: CALCULATOR_PLUS_PRICE.amountCents,
          product_data: {
            name: CALCULATOR_PLUS_PRICE.productName,
            description: CALCULATOR_PLUS_PRICE.productDescription,
          },
        },
        quantity: 1,
      };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        product: CALCULATOR_PLUS_PRICE.key,
        venue_type: String(venueType),
        daily_covers: String(dailyCovers),
        avg_order_value: String(avgOrderValue),
        missed_revenue: String(missedRevenue),
      },
    });

    if (!session.url) {
      res.status(502).json({
        success: false,
        message: 'Stripe did not return a checkout URL.',
      });
      return;
    }

    res.status(200).json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Calculator Plus checkout error:', err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Checkout failed',
    });
  }
};
