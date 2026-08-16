// api/fulfill-checkout.js
// Success-page fallback when Stripe webhooks are mis-routed (e.g. still pointing at farmer-banks).
// Retrieves a paid Checkout Session and runs the same post-payment flow as the webhook
// (tickets + purchaser row + ticket.purchased → Klaviyo).
require('./load-env');

const Stripe = require('stripe');
const { getStripeSecretKey } = require('./event-mode');
const { fulfillCheckoutSession } = require('./stripe-webhook');

function getSessionId(req) {
  if (req.method === 'GET') {
    return req.query?.session_id || req.query?.sessionId || null;
  }
  return (
    req.body?.session_id ||
    req.body?.sessionId ||
    req.query?.session_id ||
    req.query?.sessionId ||
    null
  );
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Use GET or POST.'
    });
  }

  const sessionId = getSessionId(req);
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return res.status(400).json({
      success: false,
      message: 'Missing or invalid session_id (expected Stripe Checkout Session id)'
    });
  }

  const preferTest = sessionId.startsWith('cs_test_');
  const secretKey =
    getStripeSecretKey(preferTest) || getStripeSecretKey(!preferTest) || null;

  if (!secretKey) {
    console.error('❌ FULFILL_FAILED: Stripe secret key missing');
    return res.status(500).json({
      success: false,
      message: 'Payment service not configured'
    });
  }

  const stripe = Stripe(secretKey);

  try {
    console.log('🔁 Fulfill checkout requested:', {
      sessionId,
      preferTest,
      host: req.headers.host
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Checkout session not found' });
    }

    // Require confirmed payment — do not treat session.status=complete alone as success
    // (delayed methods can be complete + unpaid; declined cards never reach success_url).
    const paymentConfirmed =
      session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
    if (!paymentConfirmed) {
      console.warn('⚠️ Fulfill skipped — payment not confirmed:', {
        sessionId,
        payment_status: session.payment_status,
        status: session.status
      });
      return res.status(402).json({
        success: false,
        message: 'Checkout session is not paid yet',
        payment_status: session.payment_status,
        status: session.status
      });
    }

    // forceKlaviyo only sends when confirmation_email_sent is not already set on the session.
    const result = await fulfillCheckoutSession(session, { forceKlaviyo: true });
    console.log('✅ Fulfill checkout completed:', {
      sessionId,
      transactionId: result?.transactionId,
      alreadyFulfilled: !!result?.alreadyFulfilled,
      emailResent: !!result?.emailResent,
      emailSkipped: !!result?.emailSkipped
    });

    return res.status(200).json({
      success: true,
      sessionId,
      alreadyFulfilled: !!result?.alreadyFulfilled,
      emailResent: !!result?.emailResent,
      emailSkipped: !!result?.emailSkipped,
      transactionId: result?.transactionId || session.metadata?.transaction_id || null,
      ticketCount: result?.ticketCount || null
    });
  } catch (error) {
    console.error('❌ FULFILL_FAILED:', error.message);
    console.error('❌ FULFILL_FAILED stack:', error.stack);
    const isEmailFailure = /EMAIL_SEND|KLAVIYO/i.test(error.message || '');
    return res.status(500).json({
      success: false,
      message: isEmailFailure
        ? 'Purchase saved but confirmation email failed to send'
        : 'Fulfillment failed',
      error: error.message,
      emailFailed: isEmailFailure
    });
  }
};
