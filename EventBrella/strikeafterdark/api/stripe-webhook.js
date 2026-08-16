// api/stripe-webhook.js - Stripe Webhook Handler for Post-Payment Flow
require('./load-env');
console.log('🔔 Stripe webhook handler loaded');

// Per-event mode: verify with the webhook secret matching Stripe event.livemode.
// TEST_MODE env is not used for payment/webhook mode selection.
const Stripe = require('stripe');
const { getStripeSecretKey, getWebhookSigningSecret } = require('./event-mode');

const stripeForWebhooks = Stripe(
  getStripeSecretKey(true) || getStripeSecretKey(false) || 'sk_placeholder'
);

// Dependencies for helper functions
const QRCode = require('qrcode');
const crypto = require('crypto');
const axios = require('axios');
const { createTicket, createPurchaserContact } = require('./ticket-db');

const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;
const KLAVIYO_API_URL = 'https://a.klaviyo.com/api/events';
const KLAVIYO_REVISION = '2024-07-15';

// In-process guard for concurrent webhook + success-page fulfill on the same instance.
const confirmationEmailInFlight = new Set();

function stripeClientForSession(session) {
  const preferTest =
    session?.livemode === false ||
    String(session?.id || '').startsWith('cs_test_');
  const key = getStripeSecretKey(preferTest) || getStripeSecretKey(!preferTest);
  return key ? Stripe(key) : null;
}

function hasConfirmationEmailBeenSent(session) {
  return String(session?.metadata?.confirmation_email_sent || '').toLowerCase() === 'true';
}

async function markConfirmationEmailSent(session) {
  if (!session?.id) return;
  const stripe = stripeClientForSession(session);
  if (!stripe) {
    console.warn('⚠️ Could not mark confirmation_email_sent — missing Stripe key');
    return;
  }
  try {
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...(session.metadata || {}),
        confirmation_email_sent: 'true',
        confirmation_email_sent_at: new Date().toISOString()
      }
    });
    if (session.metadata) {
      session.metadata.confirmation_email_sent = 'true';
    }
    console.log('✅ Marked confirmation_email_sent on session', session.id);
  } catch (err) {
    console.warn('⚠️ Failed to mark confirmation_email_sent on session:', err.message);
  }
}

function klaviyoEventUniqueId(sessionId, ticketNumber) {
  const sessionKey = sessionId || 'unknown-session';
  const ticketKey = ticketNumber != null ? String(ticketNumber) : '1';
  return `ticket-purchased:${sessionKey}:${ticketKey}`;
}

/**
 * Only fulfill / email after Stripe confirms funds (or no payment required).
 * checkout.session.completed alone is not enough for delayed methods (can be unpaid).
 * Declined cards never reach completed/paid — they emit payment_intent.payment_failed only.
 */
function isCheckoutPaymentConfirmed(session) {
  const paymentStatus = String(session?.payment_status || '');
  return paymentStatus === 'paid' || paymentStatus === 'no_payment_required';
}

/**
 * Verify signature using the secret selected from the event's livemode field.
 * Peeks at JSON livemode only to choose which signing secret to try first;
 * constructEvent still authenticates the payload.
 */
function constructStripeEvent(rawBody, sig) {
  let preferLive = false;
  try {
    const peeked = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody));
    preferLive = peeked.livemode === true;
  } catch (_) {
    preferLive = false;
  }

  const primarySecret = getWebhookSigningSecret(preferLive);
  const fallbackSecret = getWebhookSigningSecret(!preferLive);
  const secretsToTry = [primarySecret, fallbackSecret].filter(Boolean);
  // De-dupe if test/live env vars resolve to the same value
  const uniqueSecrets = [...new Set(secretsToTry)];

  if (uniqueSecrets.length === 0) {
    const missing = preferLive ? 'STRIPE_WEBHOOK_LIVE_SECRET' : 'STRIPE_WEBHOOK_TEST_SECRET';
    const err = new Error(`Webhook secret not configured (${missing})`);
    err.code = 'webhook_secret_missing';
    err.requiredEnvVar = missing;
    throw err;
  }

  let lastError = null;
  for (const secret of uniqueSecrets) {
    try {
      const event = stripeForWebhooks.webhooks.constructEvent(rawBody, sig, secret);
      // Prefer the secret that matches livemode when both somehow verify
      if (event.livemode === preferLive || uniqueSecrets.length === 1) {
        return event;
      }
      // If primary was wrong mode but verified, still accept (signature is valid)
      return event;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Webhook signature verification failed');
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, stripe-signature');

  // Handle preflight request
  const method = (req.method || '').toUpperCase();
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET requests (health check / testing)
  if (method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Stripe webhook endpoint is active',
      method: 'GET',
      endpoint: '/api/stripe-webhook',
      note: 'This endpoint only processes POST requests from Stripe. Use POST method for webhook events.'
    });
  }

  // Only accept POST requests for actual webhook events
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Only POST requests are accepted for webhook events.',
      receivedMethod: method || req.method || 'undefined',
      allowedMethods: ['POST', 'GET', 'OPTIONS']
    });
  }

  console.log('🔔 Strike After Dark Stripe Webhook received');

  // Wrap entire handler in try/catch to catch all errors
  try {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      console.error('❌ Missing stripe-signature header');
      return res.status(400).json({
        success: false,
        message: 'Missing stripe-signature header'
      });
    }
    
    // Read raw body for Vercel serverless
    // CRITICAL: Always read from stream as Buffer to preserve exact bytes
    // Stripe signature verification requires the EXACT raw bytes sent
    let rawBody;
    try {
      // Check if body is already available (some platforms pre-parse)
      if (req.body && typeof req.body === 'string') {
        rawBody = Buffer.from(req.body, 'utf8');
      } else if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
      } else {
        // Read from the raw request stream as Buffer to preserve exact bytes
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        rawBody = Buffer.concat(chunks);
      }
      
      if (!rawBody || rawBody.length === 0) {
        throw new Error('Request body is empty');
      }
    } catch (err) {
      console.error('❌ Error reading body:', err.message);
      console.error('❌ Body type:', typeof req.body);
      console.error('❌ Body is Buffer:', Buffer.isBuffer(req.body));
      return res.status(400).json({ 
        success: false,
        error: 'Invalid request body',
        details: err.message
      });
    }

    // Verify webhook signature using secret selected from event.livemode
    let event;
    try {
      event = constructStripeEvent(rawBody, sig);
      console.log('✅ Webhook signature verified:', event.type, event.id, 'livemode:', event.livemode);
    } catch (err) {
      console.error('❌ Verification failed:', err.message);
      console.error('❌ Signature header present:', !!sig);
      console.error('❌ Raw body length:', rawBody ? rawBody.length : 0);

      if (err.code === 'webhook_secret_missing') {
        return res.status(500).json({
          received: false,
          error: err.message,
          requiredEnvVar: err.requiredEnvVar
        });
      }
      
      return res.status(400).json({ 
        success: false,
        error: err.message,
        errorType: 'signature_verification_failed',
        hint: 'Check that STRIPE_WEBHOOK_TEST_SECRET / STRIPE_WEBHOOK_LIVE_SECRET match the signing secrets for this endpoint'
      });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded': {
          // Email/QR/DB only after payment is confirmed paid (not on session create,
          // not on declined cards, not on unpaid delayed-method "completed" sessions).
          const session = event.data.object;
          if (!isCheckoutPaymentConfirmed(session)) {
            console.log('ℹ️ Skipping fulfill — payment not confirmed yet:', {
              eventType: event.type,
              sessionId: session?.id,
              payment_status: session?.payment_status,
              status: session?.status
            });
            break;
          }
          await fulfillCheckoutSession(session);
          break;
        }

        case 'checkout.session.async_payment_failed':
          console.log('❌ Async checkout payment failed:', event.data.object?.id, {
            payment_status: event.data.object?.payment_status
          });
          break;
        
        case 'payment_intent.succeeded':
          // Checkout fulfillment is driven by checkout.session.* + payment_status=paid.
          break;
        
        case 'payment_intent.payment_failed':
          // Declined / failed cards — do NOT create tickets or send confirmation email.
          console.log('❌ Payment failed (no email/QR/fulfill):', event.data.object.id);
          break;
        
        default:
          // Unhandled event type
          break;
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('❌ Error in event handling:', error.message);
      console.error('❌ Error stack:', error.stack);
      return res.status(500).json({
        received: false,
        error: error.message,
        errorType: 'event_handling_error'
      });
    }
  } catch (err) {
    // Catch-all for any unexpected errors
    console.error('❌ Webhook handler error (catch-all):', err.message);
    console.error('❌ Error type:', err.constructor.name);
    console.error('❌ Error stack:', err.stack);
    console.error('❌ Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(500).json({ 
      success: false,
      error: `Webhook error: ${err.message}`,
      errorType: 'handler_error'
    });
  }
};

/**
 * Handle completed checkout session
 * This is the main post-payment flow
 */
async function handleCheckoutCompleted(session) {
  console.log('✅ Checkout session completed:', session.id);
  
  try {
    // Extract metadata from session
    const metadata = session.metadata || {};
    const transactionId = metadata.transaction_id || session.id;
    const tier = metadata.tier;
    const eventDate = metadata.event_date;
    const customerName = metadata.customer_name || 'Guest';
    const ticketCount = parseInt(metadata.ticket_count || '1', 10);
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    // Extract event details
    const eventName = metadata.event_name || 'Bosses & Bowling';
    const eventTime = metadata.event_time || '9:00 PM - 12:00 AM EST';
    const eventVenue = metadata.event_venue || 'The Alley';
    const organizerName = metadata.organizer_name || 'Strike After Dark';
    
    // Get payment amount
    const amountTotal = session.amount_total || 0;
    const amountFormatted = (amountTotal / 100).toFixed(2);
    
    // Purchase date
    const purchaseDate = new Date().toISOString();

    console.log('📋 Extracted session data:', {
      transactionId,
      tier,
      eventDate,
      eventName,
      eventTime,
      eventVenue,
      customerName,
      customerEmail,
      ticketCount,
      amountFormatted
    });

    // Generate event slug for Klaviyo flow filtering
    // Format: eventname_YYYY_MM_DD (e.g., "monthly_farm_tour_2026_01_03")
    const eventSlug = `${(eventName || 'Bosses & Bowling').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${(eventDate || '').replace(/-/g, '_')}`;

    // Get customer phone from metadata if available
    const customerPhone = metadata.customer_phone || null;

    // Prepare metadata object for helper functions
    const metadataObj = {
      transactionId,
      tier,
      eventDate,
      eventName,
      eventTime,
      eventVenue,
      organizerName,
      customerName,
      customerEmail,
      customerPhone,
      ticketCount,
      purchaseDate,
      amountFormatted,
      eventSlug,
      baseUrl: resolvePublicBaseUrl(session)
    };

    if (!customerEmail) {
      throw new Error('Missing customer email on checkout session');
    }

    // Step 1: Generate QR Code first (needed for Klaviyo event and database)
    console.log('📱 ===== STEP 1: GENERATING QR CODES =====');
    console.log('📱 Transaction ID:', transactionId);
    console.log('📱 Ticket Count:', ticketCount);
    console.log('📱 Customer Name:', customerName);
    console.log('📱 QR base URL:', metadataObj.baseUrl);

    const qrCodeData = await generateQRCode(transactionId, metadataObj);
    if (!qrCodeData?.tickets?.length) {
      throw new Error('QR code generation produced no tickets');
    }

    console.log('✅ QR code generation completed');
    console.log('✅ Number of tickets in QR data:', qrCodeData.tickets.length);

    // Step 1.5: Create ticket records in Supabase database (non-blocking for email delivery)
    console.log('💾 ===== CREATING TICKET RECORDS IN DATABASE =====');
    for (let i = 0; i < qrCodeData.tickets.length; i++) {
      const ticketData = qrCodeData.tickets[i];
      console.log(`💾 Creating ticket ${i + 1} of ${qrCodeData.tickets.length}: ${ticketData.ticketId}`);

      try {
        const ticketRecord = await createTicket({
          ticketId: ticketData.ticketId,
          transactionId: transactionId,
          eventName: eventName,
          eventDate: eventDate,
          eventTime: eventTime,
          eventVenue: eventVenue,
          vendorName: organizerName || 'Strike After Dark',
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone || null,
          ticketCount: ticketCount,
          ticketNumber: ticketData.qrCodeData.ticketNumber,
          tier: tier || 'ga',
          purchaseDate: purchaseDate,
          qrCodeUrl: ticketData.qrCodeUrl,
          checksum: ticketData.qrCodeData.checksum
        });

        if (!ticketRecord?.ticket_id) {
          console.error(`⚠️ Ticket create returned no record for ${ticketData.ticketId}`);
        } else {
          console.log(`✅ Ticket created: ${ticketRecord.ticket_id}`);
        }
      } catch (dbErr) {
        console.error(`⚠️ Ticket DB write failed for ${ticketData.ticketId} (continuing to email):`, dbErr.message);
      }
    }

    // Step 1.75: Store purchaser contact info in strikeafterdark (+ customers score row)
    console.log('💾 ===== SAVING PURCHASER CONTACT TO strikeafterdark =====');
    try {
      await createPurchaserContact({
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        transactionId,
        eventName,
        eventDate,
        eventSlug,
        tier: tier || 'ga',
        ticketCount,
        amountCents: amountTotal,
        purchaseDate
      });
      console.log('✅ Purchaser contact saved to strikeafterdark');
    } catch (contactErr) {
      console.error('⚠️ Purchaser contact save failed (continuing to email):', contactErr.message);
    }

    // Step 2: Send ticket.purchased once per Checkout Session (idempotent)
    if (hasConfirmationEmailBeenSent(session) || confirmationEmailInFlight.has(session.id)) {
      console.log('ℹ️ Skipping Klaviyo send — confirmation already sent/in-flight for session:', session.id);
      console.log('✅ Post-payment flow completed for session:', session.id);
      return { success: true, transactionId, ticketCount, emailSent: false, emailSkipped: true };
    }

    console.log('📧 Step 2: Sending ticket.purchased events to Klaviyo (one per ticket)...');
    confirmationEmailInFlight.add(session.id);
    try {
      for (let i = 0; i < qrCodeData.tickets.length; i++) {
        const ticketData = qrCodeData.tickets[i];
        const ticketQRCode = ticketData.qrCodeUrl;
        const ticketMetadata = {
          ...metadataObj,
          qrCodeUrl: ticketQRCode,
          ticketId: ticketData.ticketId,
          ticketNumber: ticketData.qrCodeData.ticketNumber,
          checkoutSessionId: session.id
        };

        const klaviyoResult = await syncToKlaviyo(
          customerEmail,
          customerName,
          ticketMetadata,
          ticketQRCode
        );
        if (!klaviyoResult?.sent) {
          throw new Error(
            `EMAIL_SEND_FAILED: Klaviyo event not sent for ticket ${ticketData.ticketId}: ${klaviyoResult?.reason || 'unknown reason'}`
          );
        }
        console.log(`✅ EMAIL_SEND: Klaviyo ticket.purchased sent for ticket ${i + 1}`);
      }
      await markConfirmationEmailSent(session);
    } finally {
      confirmationEmailInFlight.delete(session.id);
    }

    console.log('✅ Post-payment flow completed for session:', session.id);
    return { success: true, transactionId, ticketCount, emailSent: true };
  } catch (error) {
    console.error('❌ Error in handleCheckoutCompleted:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}

/**
 * Re-send confirmation emails for tickets that already exist in the DB.
 * Fixes the race where DB write succeeded but Klaviyo/email failed (or was skipped).
 */
async function sendEmailsForExistingTickets(session, existingTickets) {
  const metadata = session.metadata || {};
  const transactionId = metadata.transaction_id || session.id;
  const customerEmail = session.customer_email || session.customer_details?.email;
  const customerName = metadata.customer_name || existingTickets[0]?.customer_name || 'Guest';

  if (!customerEmail) {
    const msg = 'EMAIL_SEND_FAILED: missing customer email on session — cannot send confirmation';
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }

  const amountTotal = session.amount_total || 0;
  const amountFormatted = (amountTotal / 100).toFixed(2);
  const eventName = metadata.event_name || existingTickets[0]?.event_name || 'Bosses & Bowling';
  const eventDate = metadata.event_date || existingTickets[0]?.event_date || '';
  const eventSlug = `${String(eventName).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${String(eventDate).replace(/-/g, '_')}`;

  const metadataObj = {
    transactionId,
    tier: metadata.tier || existingTickets[0]?.tier || 'ga',
    eventDate,
    eventName,
    eventTime: metadata.event_time || existingTickets[0]?.event_time || '9:00 PM - 12:00 AM EST',
    eventVenue: metadata.event_venue || existingTickets[0]?.event_venue || 'The Alley',
    organizerName: metadata.organizer_name || 'Strike After Dark',
    customerName,
    customerEmail,
    customerPhone: metadata.customer_phone || existingTickets[0]?.customer_phone || null,
    ticketCount: existingTickets.length,
    purchaseDate: existingTickets[0]?.purchase_date || new Date().toISOString(),
    amountFormatted,
    eventSlug
  };

  if (hasConfirmationEmailBeenSent(session)) {
    console.log('ℹ️ Skipping email resend — confirmation_email_sent already set:', session.id);
    return existingTickets.map((t) => ({ ticketId: t.ticket_id, sent: false, skipped: true }));
  }

  console.log('📧 EMAIL_SEND: sending confirmation for existing tickets', {
    transactionId,
    sessionId: session.id,
    email: customerEmail,
    ticketCount: existingTickets.length
  });

  confirmationEmailInFlight.add(session.id);
  const results = [];
  try {
    for (let i = 0; i < existingTickets.length; i++) {
      const ticket = existingTickets[i];
      const ticketQRCode = ticket.qr_code_url || null;
      if (!ticketQRCode) {
        console.error('EMAIL_SEND_FAILED: ticket missing qr_code_url', {
          ticketId: ticket.ticket_id,
          transactionId
        });
      }
      try {
        const klaviyoResult = await syncToKlaviyo(
          customerEmail,
          customerName,
          {
            ...metadataObj,
            qrCodeUrl: ticketQRCode,
            ticketId: ticket.ticket_id,
            ticketNumber: ticket.ticket_number || i + 1,
            checkoutSessionId: session.id
          },
          ticketQRCode
        );
        if (!klaviyoResult?.sent) {
          throw new Error(klaviyoResult?.reason || 'Klaviyo did not confirm send');
        }
        console.log(`✅ EMAIL_SEND: confirmation triggered for ticket ${ticket.ticket_id}`);
        results.push({ ticketId: ticket.ticket_id, sent: true });
      } catch (emailErr) {
        console.error('❌ EMAIL_SEND_FAILED:', {
          ticketId: ticket.ticket_id,
          transactionId,
          email: customerEmail,
          error: emailErr.message
        });
        throw emailErr;
      }
    }
    await markConfirmationEmailSent(session);
  } finally {
    confirmationEmailInFlight.delete(session.id);
  }
  return results;
}

/**
 * Public entry for webhook + success-page fulfill paths.
 * Idempotent: confirmation email is sent at most once per Checkout Session.
 * - Stripe session metadata `confirmation_email_sent=true` is the durable flag
 * - Klaviyo `unique_id` dedupes duplicate ticket.purchased events
 * - forceKlaviyo only retries email when that flag is not set yet
 */
async function fulfillCheckoutSession(session, { forceKlaviyo = false } = {}) {
  const metadata = session.metadata || {};
  const transactionId = metadata.transaction_id || session.id;
  const { getTicketsByTransactionId } = require('./ticket-db');

  if (!isCheckoutPaymentConfirmed(session)) {
    console.warn('⚠️ Fulfill blocked — checkout payment not confirmed:', {
      sessionId: session?.id,
      payment_status: session?.payment_status,
      status: session?.status
    });
    return {
      success: false,
      blocked: true,
      reason: 'payment_not_confirmed',
      payment_status: session?.payment_status || null,
      transactionId
    };
  }

  try {
    const existing = await getTicketsByTransactionId(transactionId);
    if (existing?.length) {
      console.log('ℹ️ Purchase tickets already exist for transaction:', transactionId);
      if (hasConfirmationEmailBeenSent(session) || confirmationEmailInFlight.has(session.id)) {
        console.log('ℹ️ Confirmation already sent/in-flight — skipping Klaviyo for session:', session.id);
        return {
          success: true,
          alreadyFulfilled: true,
          emailSkipped: true,
          transactionId,
          ticketCount: existing.length
        };
      }
      // Tickets exist but email not marked sent yet — send once (recovery path).
      const emailResults = await sendEmailsForExistingTickets(session, existing);
      return {
        success: true,
        alreadyFulfilled: true,
        emailResent: !!forceKlaviyo,
        emailResults,
        transactionId,
        ticketCount: existing.length
      };
    }
  } catch (lookupErr) {
    // If lookup failed for a non-email reason, continue to full fulfill.
    // If email resend threw, rethrow so success page / webhook surfaces the failure.
    if (String(lookupErr.message || '').includes('EMAIL_SEND') || String(lookupErr.message || '').includes('KLAVIYO')) {
      throw lookupErr;
    }
    console.warn('⚠️ Idempotency lookup warning (continuing):', lookupErr.message);
  }

  return handleCheckoutCompleted(session);
}

/**
 * Send ticket.purchased event to Klaviyo
 * Triggers Klaviyo Flows configured for this event
 * Uses Klaviyo REST API v2024-07-15
 */
async function syncToKlaviyo(email, name, metadata, qrCodeUrl) {
  if (!email) {
    throw new Error('EMAIL_SEND_FAILED: Email is required for Klaviyo sync');
  }

  // Resolve at call time (not only module load) so Vercel/local env is always current.
  const apiKey =
    process.env.KLAVIYO_PRIVATE_KEY ||
    process.env.KLAVIYO_PRIVATE_API_KEY ||
    KLAVIYO_PRIVATE_KEY ||
    null;

  if (!apiKey || String(apiKey).toLowerCase().startsWith('your_')) {
    const msg =
      'EMAIL_SEND_FAILED: KLAVIYO_PRIVATE_KEY is missing or still a placeholder — confirmation email was NOT sent. ' +
      'This app emails via Klaviyo (ticket.purchased Flow), not SES.';
    console.error(`❌ ${msg}`);
    throw new Error(msg);
  }

  if (!qrCodeUrl) {
    console.error('EMAIL_SEND_FAILED: missing qrCodeUrl for ticket email', {
      email,
      ticketId: metadata.ticketId,
      transactionId: metadata.transactionId
    });
  }

  // Parse name into first/last
  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Convert amount string to number (remove dollar sign and parse as float)
  const amountNumeric = metadata.amountFormatted 
    ? parseFloat(metadata.amountFormatted.replace(/[^0-9.]/g, '')) 
    : 0;

  // Deduplicate across webhook retries + success-page fulfill using a stable unique_id.
  // Same Checkout Session + ticket number ⇒ Klaviyo ignores subsequent events.
  const uniqueId = klaviyoEventUniqueId(
    metadata.checkoutSessionId || metadata.sessionId || metadata.transactionId,
    metadata.ticketNumber || 1
  );

  // Build event payload
  // Note: Klaviyo will automatically create/update the profile if it doesn't exist
  // Including profile data in the event is the recommended approach
  const payload = {
    data: {
      type: 'event',
      attributes: {
        unique_id: uniqueId,
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email: email,
              first_name: firstName,
              last_name: lastName || undefined
            }
          }
        },
        metric: {
          data: {
            type: 'metric',
            attributes: {
              name: 'ticket.purchased'
            }
          }
        },
        properties: {
          transaction_id: metadata.transactionId,
          event_name: metadata.eventName || 'Bosses & Bowling',
          event_date: metadata.eventDate,
          event_time: metadata.eventTime || '9:00 PM - 12:00 AM EST',
          event_venue: metadata.eventVenue || 'The Alley',
          ticket_count: metadata.ticketCount,
          ticket_id: metadata.ticketId || null, // Individual ticket ID (unique per ticket)
          ticket_number: metadata.ticketNumber || null, // Ticket number (1, 2, 3...)
          tier: metadata.tier,
          amount: amountNumeric,
          qr_code_url: qrCodeUrl || null, // Unique QR code for THIS specific ticket
          event_slug: metadata.eventSlug,
          organizer_name: metadata.organizerName || 'Strike After Dark',
          customer_name: metadata.customerName,
          purchase_date: metadata.purchaseDate,
          email_subject: `Strike After Dark — ${metadata.eventName || 'Bosses & Bowling'}`,
          email_title: 'Strike After Dark'
        },
        value: amountNumeric,
        time: new Date().toISOString()
      }
    }
  };

  // Remove undefined/null values from profile attributes
  if (!payload.data.attributes.profile.data.attributes.last_name) {
    delete payload.data.attributes.profile.data.attributes.last_name;
  }

  // Remove null/undefined values from properties
  Object.keys(payload.data.attributes.properties).forEach(key => {
    if (payload.data.attributes.properties[key] === null || 
        payload.data.attributes.properties[key] === undefined) {
      delete payload.data.attributes.properties[key];
    }
  });

  try {
    console.log('🔍 EMAIL_SEND: Sending Klaviyo ticket.purchased event:', {
      email,
      metric: 'ticket.purchased',
      uniqueId,
      transactionId: metadata.transactionId,
      checkoutSessionId: metadata.checkoutSessionId || null,
      ticketId: metadata.ticketId,
      hasQr: !!qrCodeUrl,
      apiKeyPrefix: String(apiKey).substring(0, 10)
    });

    const response = await axios.post(
      KLAVIYO_API_URL,
      payload,
      {
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'revision': KLAVIYO_REVISION,
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging
        timeout: 10000
      }
    );

    console.log('✅ EMAIL_SEND: Klaviyo event accepted (Flow must send the email):', {
      email,
      eventId: response.data?.data?.id,
      status: response.status
    });

    return { sent: true, eventId: response.data?.data?.id };
  } catch (error) {
    // Log detailed error for debugging
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      console.error('❌ EMAIL_SEND_FAILED / KLAVIYO_DELIVERY_FAILED:', {
        status: status,
        statusText: error.response.statusText,
        data: JSON.stringify(errorData, null, 2),
        email,
        url: KLAVIYO_API_URL,
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey ? String(apiKey).substring(0, 10) : 'missing',
        transactionId: metadata.transactionId,
        ticketId: metadata.ticketId
      });
      console.error('❌ Payload sent:', JSON.stringify(payload, null, 2));
      
      if (status === 400 || status === 409 || status === 422) {
        const errorMessage = JSON.stringify(errorData).toLowerCase();
        if (errorMessage.includes('already exists') || 
            errorMessage.includes('duplicate') ||
            errorMessage.includes('profile')) {
          console.warn('⚠️ Klaviyo profile may already exist, but event should still trigger Flow');
          return { sent: true, eventId: null, warning: 'Profile may already exist' };
        }
      }
      
      throw new Error(`EMAIL_SEND_FAILED / KLAVIYO_DELIVERY_FAILED (${status}): ${JSON.stringify(errorData)}`);
    } else {
      console.error('❌ EMAIL_SEND_FAILED request error:', error.message, {
        email,
        transactionId: metadata.transactionId,
        ticketId: metadata.ticketId
      });
      throw error;
    }
  }
}

/**
 * Public site origin for QR validation links (must be reachable by scanners).
 */
function resolvePublicBaseUrl(session) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, '')}`;
  }
  try {
    const successUrl = session?.success_url || '';
    if (successUrl.startsWith('http')) {
      return new URL(successUrl).origin;
    }
  } catch (_) {
    /* ignore */
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`;
  }
  return 'https://strikeafterdark.vercel.app';
}

/**
 * Generate QR code for ticket
 * Returns data URL (base64 string) that can be embedded in email
 * QR code contains a URL that points to validation endpoint
 * (Existing strikeafterdark logic — reused; not ported from farmerBanks.)
 */
async function generateQRCode(transactionId, metadata) {
  if (!transactionId) {
    throw new Error('Transaction ID is required for QR code generation');
  }

  const baseUrl = (metadata.baseUrl || resolvePublicBaseUrl(null) || 'https://strikeafterdark.vercel.app').replace(/\/$/, '');

    // Generate unique ticket ID for each ticket
    const tickets = [];
    for (let i = 0; i < metadata.ticketCount; i++) {
      const ticketNumber = i + 1;
      const ticketId = `TKT_${transactionId}_${ticketNumber}`;
      
      // Generate checksum for validation
      const checksum = generateChecksum(ticketId, transactionId, metadata.customerName);
      
      // Create validation URL with all purchaser data encoded in query params
      // This URL will be what the QR code contains - includes all tracking data
      const validationUrl = `${baseUrl}/api/validate-ticket?ticketId=${encodeURIComponent(ticketId)}&transactionId=${encodeURIComponent(transactionId)}&checksum=${encodeURIComponent(checksum)}&eventName=${encodeURIComponent(metadata.eventName || 'Bosses & Bowling')}&eventDate=${encodeURIComponent(metadata.eventDate || '')}&eventTime=${encodeURIComponent(metadata.eventTime || '')}&customerName=${encodeURIComponent(metadata.customerName || '')}&customerEmail=${encodeURIComponent(metadata.customerEmail || '')}&customerPhone=${encodeURIComponent(metadata.customerPhone || '')}&ticketCount=${encodeURIComponent(metadata.ticketCount || 1)}&ticketNumber=${encodeURIComponent(ticketNumber)}&purchaseDate=${encodeURIComponent(metadata.purchaseDate || '')}`;

      // Create QR code data structure (for reference, stored in metadata)
      const qrData = {
        ticketId: ticketId,
        transactionId: transactionId,
        eventName: metadata.eventName || 'Bosses & Bowling',
        eventDate: metadata.eventDate || null,
        eventTime: metadata.eventTime || '9:00 PM - 12:00 AM EST',
        eventVenue: metadata.eventVenue || 'The Alley',
        organizerName: metadata.organizerName || 'Strike After Dark',
        tier: metadata.tier,
        purchaseDate: metadata.purchaseDate,
        customerName: metadata.customerName,
        ticketNumber: ticketNumber,
        ticketCount: metadata.ticketCount,
        checksum: checksum,
        version: '1.0',
        source: 'strike_after_dark'
      };

    // Generate QR code as data URL (for embedding in emails)
    // QR code contains the validation URL, not JSON
    const qrCodeUrl = await QRCode.toDataURL(validationUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    tickets.push({
      ticketId: ticketId,
      qrCodeData: qrData,
      qrCodeUrl: qrCodeUrl,
      validationUrl: validationUrl
    });
  }

  // Return all tickets data for database creation
  // Also return the first ticket's QR code URL for email (they're all the same)
  return {
    qrCodeUrl: tickets[0]?.qrCodeUrl || null,
    tickets: tickets // All ticket data for database
  };
}

/**
 * Generate checksum for QR code validation
 */
function generateChecksum(ticketId, transactionId, customerName) {
  const data = `${ticketId}-${transactionId}-${customerName}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 20);
}

/**
 * Send confirmation email with ticket via Klaviyo
 * Triggers a Klaviyo event that can be used in a Flow to send transactional email
 */
async function sendConfirmationEmail(email, name, data) {
  if (!email) {
    throw new Error('Email is required');
  }

  // Check for API key
  if (!process.env.KLAVIYO_PRIVATE_API_KEY && !KLAVIYO_PRIVATE_KEY) {
    console.error('❌ KLAVIYO_PRIVATE_API_KEY is not set');
    return { success: false, error: 'API key missing' };
  }
  
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY || KLAVIYO_PRIVATE_KEY;
  console.log('✅ Klaviyo API Key found (first 10 chars):', apiKey.substring(0, 10));

  // Email is always live — never mock Klaviyo, even when Stripe is in test/sandbox mode
  if (!apiKey) {
    console.log('📨 [EMAIL LOG] Missing Klaviyo API key — cannot send:', {
      to: email,
      eventName: 'ticket.purchased',
      subject: `Strike After Dark — ${data.eventName || 'Bosses & Bowling'}`,
      customerName: name,
      transactionId: data.transactionId,
      hasQRCode: !!data.qrCodeUrl
    });
    return { sent: false, logged: true, testMode: true };
  }

  try {
    // Parse customer name into first/last
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Trigger a Klaviyo event that can be used in a Flow to send transactional email
    // The Flow should be set up in Klaviyo dashboard to listen for "ticket.purchased" event
    const eventData = {
      data: {
        type: 'event',
        attributes: {
          profile: {
            email: email,
            first_name: firstName,
            last_name: lastName
          },
          metric: {
            name: 'ticket.purchased'
          },
          properties: {
            event_name: data.eventName || 'Bosses & Bowling',
            event_date: data.eventDate,
            event_time: data.eventTime || '9:00 PM - 12:00 AM EST',
            venue_name: data.eventVenue || 'The Alley',
            venue_address: data.venueAddress || '',
            ticket_quantity: data.ticketCount || 1,
            ticket_type: data.tier,
            qr_code_url: data.qrCodeUrl || null,
            transaction_id: data.transactionId,
            total_price: data.amountFormatted ? parseFloat(data.amountFormatted) : 0,
            customer_name: name,
            organizer_name: data.organizerName || 'Strike After Dark',
            event_slug: data.eventSlug || 'bosses_bowling_2026_06_04',
            ticket_number: data.ticketNumber || 1,
            purchase_date: data.purchaseDate,
            email_subject: `Strike After Dark — ${data.eventName || 'Bosses & Bowling'}`,
            email_title: 'Strike After Dark'
          },
          time: new Date().toISOString()
        }
      }
    };

    // Remove null/undefined values
    Object.keys(eventData.data.attributes.properties).forEach(key => {
      if (eventData.data.attributes.properties[key] === null || eventData.data.attributes.properties[key] === undefined) {
        delete eventData.data.attributes.properties[key];
      }
    });

    console.log('=== Sending to Klaviyo ===');
    console.log('Email:', eventData.data.attributes.profile.email);
    console.log('Metric:', eventData.data.attributes.metric.name);
    console.log('Full Payload:', JSON.stringify(eventData, null, 2));

    const response = await axios.post(
      'https://a.klaviyo.com/api/events/',
      eventData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'revision': '2024-10-15'
        }
      }
    )
    .then(res => {
      console.log('✅ Klaviyo Response Status:', res.status);
      console.log('✅ Klaviyo Response Data:', JSON.stringify(res.data, null, 2));
      console.log('Klaviyo event triggered for email:', {
        email,
        eventId: res.data?.data?.id,
        eventName: 'ticket.purchased'
      });
      return res;
    })
    .catch(err => {
      console.error('❌ Klaviyo API Error Status:', err.response?.status);
      console.error('❌ Klaviyo API Error Data:', JSON.stringify(err.response?.data, null, 2));
      console.error('❌ Full Error:', err.message);
      throw err;
    });

    return { sent: true, eventId: response.data?.data?.id, testMode: false };
  } catch (error) {
    if (error.response) {
      console.error('❌ Klaviyo event API error:', error.response.status, error.response.data);
      throw new Error(`Klaviyo event API error: ${error.response.status}`);
    }
    throw error;
  }
}

// Only for testing — sends ticket.purchased event to Klaviyo
if (require.main === module) {
  const testPayload = {
    data: {
      type: "event",
      attributes: {
        metric: { data: { type: "metric", attributes: { name: "ticket.purchased" } } },
        properties: {
          eventSlug: "bosses_bowling_2026_06_04",
          eventName: "Bosses & Bowling",
          eventDate: "2026-06-04",
          eventTime: "9:00 PM - 12:00 AM EST",
          eventVenue: "The Alley",
          organizerName: "Strike After Dark",
          transactionId: "TXN_TEST_001",
          ticketCount: 1,
          ticketNumber: 1,
          tier: "ga",
          amount: "20.00",
          qrCodeUrl: "data:image/png;base64,...",
          purchaseDate: new Date().toISOString(),
          customerName: "Test User",
          email: "test@example.com"
        },
        profile: { data: { type: "profile", attributes: { email: "test@example.com" } } }
      }
    }
  };

  // Extract test data for sendConfirmationEmail function
  const testEmail = "test@example.com";
  const testName = "Test User";
  const testData = {
    eventSlug: "bosses_bowling_2026_06_04",
    eventName: "Bosses & Bowling",
    eventDate: "2026-06-04",
    eventTime: "9:00 PM - 12:00 AM EST",
    eventVenue: "The Alley",
    organizerName: "Strike After Dark",
    transactionId: "TXN_TEST_001",
    ticketCount: 1,
    ticketNumber: 1,
    tier: "ga",
    amountFormatted: "20.00",
    qrCodeUrl: "data:image/png;base64,...",
    purchaseDate: new Date().toISOString()
  };

  sendConfirmationEmail(testEmail, testName, testData)
    .then(() => console.log("✅ Test event sent to Klaviyo"))
    .catch((err) => console.error(err));
}

// Disable Vercel's automatic body parsing for Stripe webhook signature verification
const webhookHandler = module.exports;
webhookHandler.fulfillCheckoutSession = fulfillCheckoutSession;
webhookHandler.handleCheckoutCompleted = handleCheckoutCompleted;
webhookHandler.syncToKlaviyo = syncToKlaviyo;
webhookHandler.isCheckoutPaymentConfirmed = isCheckoutPaymentConfirmed;

module.exports = webhookHandler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
