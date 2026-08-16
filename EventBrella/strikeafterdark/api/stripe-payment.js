// api/stripe-payment.js - Stripe Checkout Session Creation for Strike After Dark
require('./load-env');
console.log('🔧 Stripe payment function loaded');

const Stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');
const { resolveIsStripeTestMode, getStripeSecretKey } = require('./runtime-env');

const TIER_META = {
  ga: { label: 'General Admission', envPrice: 'TIER_GA_PRICE', defaultCents: 2000 },
  lane: { label: 'Lane Reserve', envPrice: 'TIER_LANE_PRICE', defaultCents: 3500 },
  vip: { label: 'VIP Lane Experience', envPrice: 'TIER_VIP_PRICE', defaultCents: 8500 },
  vip_bottle: { label: 'VIP Lane + Bottle', envPrice: 'TIER_VIP_BOTTLE_PRICE', defaultCents: 45000 },
  all_access: { label: 'All-Access', envPrice: 'TIER_ALL_ACCESS_PRICE', defaultCents: 85000 },
  basic: { label: 'General Admission', envPrice: 'TIER_GA_PRICE', defaultCents: 2000 },
  // Social Lounge ticket tiers (price sheet)
  lounge_all_access: {
    label: 'All Access Pass',
    envPrice: 'TIER_LOUNGE_ALL_ACCESS_PRICE',
    defaultCents: 2500,
    description: 'Access to BOTH parties: New Social Lounge & The Bowling Experience PLUS an Unlimited Arcade Play Pass (Unlimited games all night long!)',
  },
  lounge_ga: {
    label: 'General Admission (Social Lounge Only)',
    envPrice: 'TIER_LOUNGE_GA_PRICE',
    defaultCents: 1500,
    description: 'Entry to the Social Lounge experience.',
  },
  lounge_ga_arcade: {
    label: 'General Admission + Arcade Play Pass',
    envPrice: 'TIER_LOUNGE_GA_ARCADE_PRICE',
    defaultCents: 2000,
    description: 'Includes entry to the Social Lounge + Unlimited Arcade Play Pass (Play unlimited arcade games all night!)',
  },
};

function getBaseUrl(req) {
  // Prefer the live request host so Stripe always returns to this deployment,
  // not a stale BASE_URL left over from another EventBrella project.
  const host = req.headers.host || req.headers['x-forwarded-host'];
  if (host) {
    const isLocal = host.includes('localhost') || host.startsWith('127.0.0.1');
    const proto = req.headers['x-forwarded-proto'] || (isLocal ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  return 'http://localhost:3000';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS' || req.method?.toUpperCase() === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Only POST requests are accepted.',
      allowedMethods: ['POST', 'OPTIONS']
    });
  }

  const baseUrl = getBaseUrl(req);

  try {
    const {
      tier,
      eventDate,
      eventName,
      eventId,
      customerEmail,
      customerName,
      customerPhone,
      ticketCount = 1,
      platformFee = false,
      cancelPath,
      cfTurnstileResponse: token
    } = req.body;

    // Staging/Preview always forces Stripe TEST keys via runtime-env.
    // Production keeps per-event mode + SOCIAL_LOUNGE_IS_TEST_MODE override.
    const isTestMode = resolveIsStripeTestMode({
      eventId,
      eventDate,
      eventName,
      tier,
      bodyIsTestMode: req.body?.isTestMode
    });
    const stripeSecretKey = getStripeSecretKey(isTestMode);
    const stripe = stripeSecretKey ? Stripe(stripeSecretKey) : null;

    console.log('💳 Stripe payment function called:', {
      method: req.method,
      url: req.url,
      host: req.headers.host,
      baseUrl,
      eventId: eventId || null,
      eventDate,
      eventName,
      isTestMode,
      hasBody: !!req.body
    });

    // Turnstile only required for live-mode events
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (secret && !isTestMode) {
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Security verification missing. Please complete the verification and try again.'
        });
      }
      const verifyURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      const userIP =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        '';
      const verifyRes = await fetch(verifyURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token, remoteip: userIP || undefined })
      });
      const data = await verifyRes.json();
      if (!data.success) {
        console.warn('Turnstile verification failed:', data);
        return res.status(400).json({
          success: false,
          message: 'Security verification failed. Please try again.'
        });
      }
    }

    if (!tier || !eventDate || !customerEmail || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tier, eventDate, customerEmail, customerName'
      });
    }

    const validTiers = Object.keys(TIER_META);
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        message: `Invalid tier. Must be one of: ${validTiers.join(', ')}`
      });
    }

    const meta = TIER_META[tier];
    const unitPrice = parseInt(process.env[meta.envPrice] || String(meta.defaultCents), 10);
    if (!unitPrice || Number.isNaN(unitPrice)) {
      return res.status(500).json({
        success: false,
        message: `Price not configured for tier: ${tier}`
      });
    }

    if (!stripe) {
      console.error('❌ Stripe not initialized - missing secret key');
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured. Missing Stripe secret key.',
        mode: isTestMode ? 'TEST' : 'LIVE',
        requiredKey: isTestMode ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_LIVE_SECRET_KEY'
      });
    }

    const transactionId = `TXN_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
    const isLoungeTier = String(tier).startsWith('lounge_');
    const resolvedEventName = eventName || (isLoungeTier ? 'Social Lounge' : 'Bosses & Bowling');
    const eventTime = '9:00 PM - 12:00 AM EST';
    const ticketName = `${meta.label} — Strike After Dark`;
    const productDescription = meta.description
      ? `${meta.description} · ${resolvedEventName} · ${eventDate}`
      : `Strike After Dark · The Alley · ${resolvedEventName} · ${eventDate}`;

    // Product tax code from Stripe Tax Codes list (General - Services).
    // Confirm with a tax advisor before go-live; admissions may warrant a more specific code.
    const EVENT_TICKET_TAX_CODE = process.env.STRIPE_EVENT_TAX_CODE || 'txcd_20030000';
    const TRANSACTION_FEE_RATE = 0.075;

    const ticketSubtotalCents = unitPrice * ticketCount;
    const transactionFeeCents = Math.round(ticketSubtotalCents * TRANSACTION_FEE_RATE);

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: ticketName,
            description: productDescription.slice(0, 500),
            tax_code: EVENT_TICKET_TAX_CODE
          },
          unit_amount: unitPrice,
          tax_behavior: 'exclusive'
        },
        quantity: ticketCount
      },
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Transaction fee (7.5%)',
            description: 'Service / transaction fee',
            tax_code: EVENT_TICKET_TAX_CODE
          },
          unit_amount: transactionFeeCents,
          tax_behavior: 'exclusive'
        },
        quantity: 1
      }
    ];

    let cancelUrl = platformFee
      ? `${baseUrl}/platformDrivenPages/allevents.html`
      : `${baseUrl}/allevents.html`;
    if (typeof cancelPath === 'string' && cancelPath.startsWith('/')) {
      cancelUrl = `${baseUrl}${cancelPath}`;
    } else if (isLoungeTier) {
      cancelUrl = `${baseUrl}/#lounge`;
    }

    // Warn when Stripe Tax has no active registrations (tax will calculate as $0).
    try {
      const regs = await stripe.tax.registrations.list({ status: 'active', limit: 5 });
      if (!regs.data?.length) {
        console.warn(
          '⚠️ STRIPE_TAX_NO_ACTIVE_REGISTRATION: automatic_tax is enabled but no active Tax Registrations were found. ' +
            'Add a collecting registration for your venue jurisdiction (e.g. Florida) in Stripe Dashboard → Tax, ' +
            'or tax will silently calculate as $0.'
        );
      } else {
        console.log('✅ Stripe Tax active registrations:', regs.data.map((r) => r.country).join(', '));
      }
    } catch (taxRegErr) {
      console.warn('⚠️ Could not list Stripe Tax registrations:', taxRegErr.message);
    }

    const sessionParams = {
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      // Stripe Tax: separate tax line based on registered business jurisdiction + customer address.
      // Do not hardcode rates. Requires an active Tax Registration to actually collect.
      automatic_tax: { enabled: true },
      metadata: {
        transaction_id: transactionId,
        tier,
        tier_label: meta.label,
        amount_cents: String(unitPrice),
        ticket_subtotal_cents: String(ticketSubtotalCents),
        transaction_fee_cents: String(transactionFeeCents),
        transaction_fee_rate: String(TRANSACTION_FEE_RATE),
        event_date: eventDate,
        event_name: resolvedEventName,
        event_id: eventId || '',
        customer_name: customerName,
        customer_phone: customerPhone || '',
        ticket_count: ticketCount.toString(),
        event_time: eventTime,
        event_venue: 'The Alley',
        organizer_name: 'Strike After Dark',
        experience: isLoungeTier ? 'social_lounge' : 'bowling',
        platform_fee: 'false'
      }
    };

    // Live-mode events: Connect destination charge with platform fee.
    // Test-mode events: charge the platform test account directly (no Connect transfer).
    if (!isTestMode) {
      const applicationFeeAmount = Math.round(ticketSubtotalCents * 0.07);
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: process.env.STRIPE_CONNECT_ACCOUNT_ID || 'acct_1SaTRzHz3wpz4PCZ'
        }
      };
      // Platform is merchant of record on destination charges — tax liability stays on platform.
      sessionParams.automatic_tax = {
        enabled: true,
        liability: { type: 'self' }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('✅ Checkout session created:', {
      sessionId: session.id,
      transactionId,
      tier,
      ticketCount,
      ticketSubtotalCents,
      transactionFeeCents,
      automaticTax: true,
      mode: isTestMode ? 'TEST' : 'LIVE'
    });

    return res.status(200).json({
      success: true,
      testMode: isTestMode,
      sessionUrl: session.url,
      transactionId,
      sessionId: session.id
    });
  } catch (error) {
    console.error('❌ Stripe Checkout API error:', error);

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
