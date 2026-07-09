// api/stripe-payment.js - Stripe Checkout Session Creation (client-agnostic template)
const path = require('path');
// Load .env from this project root only (TEST_MODE and Stripe keys live here)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔧 Stripe payment function loaded');

// Use toggle to determine test vs live mode
const IS_TEST_MODE = process.env.TEST_MODE === 'true';

// Select keys based on toggle
const STRIPE_SECRET_KEY = IS_TEST_MODE 
  ? process.env.STRIPE_TEST_SECRET_KEY 
  : process.env.STRIPE_LIVE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;
const { v4: uuidv4 } = require('uuid');

console.log('🔧 Stripe initialized:', { 
  hasStripe: !!stripe, 
  testMode: IS_TEST_MODE,
  mode: IS_TEST_MODE ? 'TEST' : 'LIVE',
  hasKey: !!STRIPE_SECRET_KEY
});

// Get base URL from environment, request headers, or use default
function getBaseUrl(req) {
  // Priority 1: Environment variable
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  
  // Priority 2: Detect from request headers (use request host when present)
  const host = req.headers.host || req.headers['x-forwarded-host'];
  if (host) {
    return `https://${host}`;
  }
  
  // Priority 3: VERCEL_URL (for preview deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Priority 4: Fallback (set BASE_URL per client)
  return process.env.BASE_URL || 'https://itll-happen-boyz.eventbrella.us';
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS' || req.method?.toUpperCase() === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Explicitly check for POST method - return 405 if not POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Only POST requests are accepted.',
      allowedMethods: ['POST', 'OPTIONS']
    });
  }

  // Get base URL for logging
  const baseUrl = getBaseUrl(req);
  
  console.log('💳 Stripe payment function called:', {
    method: req.method,
    url: req.url,
    host: req.headers.host,
    forwardedHost: req.headers['x-forwarded-host'],
    baseUrl: baseUrl,
    testMode: IS_TEST_MODE,
    hasBody: !!req.body
  });

  try {
    const {
      tier,
      eventDate,
      eventName,
      customerEmail,
      customerName,
      customerPhone,
      ticketCount = 1,
      platformFee = false
    } = req.body;

    // Validate required fields
    if (!tier || !eventDate || !customerEmail || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tier, eventDate, customerEmail, customerName'
      });
    }

    // Single ticket: $50 Team Registration
    const validTiers = ['registration'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tier. Only registration ticket is available.'
      });
    }

    // Single price: $50 registration (in cents)
    const tierPrices = {
      'registration': 5000   // $50
    };

    const unitPrice = tierPrices[tier];
    if (!unitPrice || Number.isNaN(unitPrice)) {
      return res.status(500).json({
        success: false,
        message: `Price not configured for tier: ${tier}`
      });
    }

    // Generate unique transaction ID
    const transactionId = `TXN_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

    // Check if Stripe is initialized
    if (!stripe) {
      console.error('❌ Stripe not initialized - missing secret key');
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured. Missing Stripe secret key.',
        mode: IS_TEST_MODE ? 'TEST' : 'LIVE',
        requiredKey: IS_TEST_MODE ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_LIVE_SECRET_KEY'
      });
    }

    // TEST MODE: Return mock checkout session
    if (IS_TEST_MODE) {
      console.log('🧪 TEST MODE: Returning mock checkout session');
      return res.status(200).json({
        success: true,
        testMode: true,
        sessionUrl: 'https://checkout.stripe.com/test/session_mock',
        transactionId: transactionId,
        sessionId: `cs_test_${transactionId}`
      });
    }

    // PRODUCTION MODE: Create Stripe Checkout Session
    const eventTime = '8:00 AM - 6:00 PM';
    const tierNames = { 'registration': 'Team Registration' };
    const ticketName = eventName ? `${eventName} - ${tierNames[tier] || tier}` : `Summer Showcase 2026 - Team Registration`;
    
    // Build line items array
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: ticketName,
            description: `${process.env.ORGANIZER_NAME || 'Organizer'} - ${eventName || 'Event'} - ${eventDate}`
          },
          unit_amount: unitPrice
        },
        quantity: ticketCount
      }
    ];
    
    // Calculate 7% application fee for platform
    const totalAmount = unitPrice * ticketCount; // Total in cents
    const applicationFeeAmount = Math.round(totalAmount * 0.07); // 7% platform fee
    
    // Determine cancel URL based on platformFee flag
    const cancelUrl = platformFee 
      ? `${baseUrl}/platformDrivenPages/tours/summer-showcase.html`
      : `${baseUrl}/summer-showcase`;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount, // You get 7%
        transfer_data: {
          destination: 'acct_1SaTRzHz3wpz4PCZ', // Erik gets 93%
        },
      },
      metadata: {
        transaction_id: transactionId,
        tier: tier,
        event_date: eventDate,
        event_name: eventName || 'Monthly Farm Tour',
        customer_name: customerName,
        ticket_count: ticketCount.toString(),
        event_time: eventTime,
        event_venue: process.env.CLIENT_VENUE_NAME || 'TBA',
        organizer_name: process.env.ORGANIZER_NAME || "It'll Happen Boyz Summer Showcase",
        platform_fee: 'false'
      }
    });

    console.log('✅ Checkout session created:', {
      sessionId: session.id,
      transactionId,
      tier,
      ticketCount
    });

    return res.status(200).json({
      success: true,
      sessionUrl: session.url,
      transactionId: transactionId,
      sessionId: session.id
    });

  } catch (error) {
    console.error('❌ Stripe Checkout API error:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: 'Card declined',
        error: error.message
      });
    } else if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: error.message
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        error: error.message
      });
    } else if (error.type === 'StripeAPIError') {
      return res.status(500).json({
        success: false,
        message: 'Stripe API error',
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
