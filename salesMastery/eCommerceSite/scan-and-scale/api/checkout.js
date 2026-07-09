const { getProduct, buildLineItem } = require('../config/stripe-products');
const { getBaseUrl } = require('../lib/base-url');
const {
  stripe,
  getRequiredSecretEnvName,
  getStripeModeLabel,
} = require('../lib/stripe-config');

/**
 * POST /api/checkout — Stripe Checkout (hosted).
 * Body: { priceId: string } — catalog key from config/stripe-products.js
 * Requires only STRIPE_TEST_SECRET_KEY / STRIPE_LIVE_SECRET_KEY (see lib/stripe.js).
 */
module.exports = async function checkoutHandler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Use POST.',
    });
    return;
  }

  const priceId =
    typeof req.body?.priceId === 'string' ? req.body.priceId : undefined;

  if (!priceId?.trim()) {
    res.status(400).json({ success: false, message: 'Missing priceId' });
    return;
  }

  const product = getProduct(priceId);
  if (!product) {
    res.status(400).json({
      success: false,
      message: 'Unknown product.',
    });
    return;
  }

  if (!stripe) {
    res.status(500).json({
      success: false,
      message: `Payment service not configured. Set ${getRequiredSecretEnvName()} for ${getStripeModeLabel()} mode.`,
    });
    return;
  }

  const baseUrl = getBaseUrl(req);
  const isAudit = priceId.trim() === 'qr-revenue-audit';
  const successUrl = isAudit
    ? `${baseUrl}/audit/start?session_id={CHECKOUT_SESSION_ID}`
    : `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = isAudit ? `${baseUrl}/audit` : `${baseUrl}/products`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: product.mode === 'subscription' ? 'subscription' : 'payment',
      line_items: [buildLineItem(product)],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        product: product.key,
      },
    });

    if (!session.url) {
      res.status(502).json({
        success: false,
        message: 'Stripe did not return a checkout URL.',
      });
      return;
    }

    res.status(200).json({ success: true, url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Checkout failed';
    console.error('Stripe Checkout error:', err);
    res.status(500).json({ success: false, message });
  }
};
