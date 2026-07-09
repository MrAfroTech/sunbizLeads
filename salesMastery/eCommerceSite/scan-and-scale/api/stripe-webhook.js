const {
  stripe,
  getStripeWebhookSecret,
  getStripeModeLabel,
  isStripeTestMode,
} = require('../lib/stripe-config');

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * POST /api/stripe-webhook
 * Uses STRIPE_WEBHOOK_TEST_SECRET or STRIPE_WEBHOOK_LIVE_SECRET (by mode).
 */
module.exports = async function stripeWebhookHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, stripe-signature'
  );

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      mode: getStripeModeLabel(),
      endpoint: '/api/stripe-webhook',
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    const envName = isStripeTestMode()
      ? 'STRIPE_WEBHOOK_TEST_SECRET'
      : 'STRIPE_WEBHOOK_LIVE_SECRET';
    res.status(500).json({
      success: false,
      message: `Webhook not configured. Set ${envName}.`,
    });
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    res.status(400).json({ success: false, message: 'Missing stripe-signature' });
    return;
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Stripe webhook verify error:', message);
    res.status(400).json({ success: false, message });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Stripe checkout completed:', {
      mode: getStripeModeLabel(),
      sessionId: session.id,
      product: session.metadata?.product,
    });
  }

  res.status(200).json({ received: true });
};
