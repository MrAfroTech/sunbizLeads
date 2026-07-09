// api/stripe-webhook.js - Stripe Webhook Handler for Post-Payment Flow
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔔 Stripe webhook handler loaded');

// Use toggle to determine test vs live mode
const IS_TEST_MODE = process.env.TEST_MODE === 'true';

// Select keys based on toggle
const STRIPE_SECRET_KEY = IS_TEST_MODE 
  ? process.env.STRIPE_TEST_SECRET_KEY 
  : process.env.STRIPE_LIVE_SECRET_KEY;

const STRIPE_WEBHOOK_SECRET = IS_TEST_MODE 
  ? process.env.STRIPE_WEBHOOK_TEST_SECRET 
  : process.env.STRIPE_WEBHOOK_LIVE_SECRET;

// Always initialize Stripe if we have a secret key (needed for webhook verification)
// Only set to null if no secret key is available at all
const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

// Log which webhook secret is being used
console.log(`🔧 Using webhook secret: ${IS_TEST_MODE ? 'STRIPE_WEBHOOK_TEST_SECRET' : 'STRIPE_WEBHOOK_LIVE_SECRET'}`);

// Dependencies for helper functions
const QRCode = require('qrcode');
const crypto = require('crypto');
const axios = require('axios');
const { createTicket } = require('./ticket-db');

const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;
const KLAVIYO_API_URL = 'https://a.klaviyo.com/api/events';
const KLAVIYO_REVISION = '2024-07-15';

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

  console.log('🔔 Stripe Webhook received');

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
    
    if (!STRIPE_WEBHOOK_SECRET) {
      const missingSecret = IS_TEST_MODE ? 'STRIPE_WEBHOOK_TEST_SECRET' : 'STRIPE_WEBHOOK_LIVE_SECRET';
      console.error(`❌ ${missingSecret} not configured`);
      // Still return 200 to prevent Stripe from retrying
      return res.status(200).json({ 
        received: true, 
        error: `Webhook secret not configured for ${IS_TEST_MODE ? 'TEST' : 'LIVE'} mode`,
        requiredEnvVar: missingSecret
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

    // Verify webhook signature
    // CRITICAL: Pass Buffer directly to constructEvent, not string
    // Stripe needs exact bytes for signature verification
    let event;
    try {
      if (!stripe) {
        throw new Error('Stripe not initialized - cannot verify webhook');
      }
      
      // Pass Buffer directly - constructEvent accepts Buffer or string
      // Buffer preserves exact bytes, string conversion can modify them
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
      
      console.log('✅ Webhook signature verified:', event.type, event.id);
    } catch (err) {
      console.error('❌ Verification failed:', err.message);
      console.error('❌ Webhook secret configured:', !!STRIPE_WEBHOOK_SECRET);
      console.error('❌ Webhook secret length:', STRIPE_WEBHOOK_SECRET ? STRIPE_WEBHOOK_SECRET.length : 0);
      console.error('❌ Signature header present:', !!sig);
      console.error('❌ Raw body length:', rawBody ? rawBody.length : 0);
      
      return res.status(400).json({ 
        success: false,
        error: err.message,
        errorType: 'signature_verification_failed',
        hint: 'Check that STRIPE_WEBHOOK_LIVE_SECRET (or STRIPE_WEBHOOK_TEST_SECRET) matches the signing secret in Stripe Dashboard'
      });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object);
          break;
        
        case 'payment_intent.succeeded':
          // Legacy event, ignoring
          break;
        
        case 'payment_intent.payment_failed':
          console.log('❌ Payment failed:', event.data.object.id);
          break;
        
        default:
          // Unhandled event type
          break;
      }

      // Always return 200 to Stripe (even if helper functions fail)
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('❌ Error in event handling:', error.message);
      // Always return 200 to Stripe to prevent retries
      return res.status(200).json({ 
        received: true, 
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
    const eventName = metadata.event_name || process.env.CLIENT_DEFAULT_EVENT_NAME || "Summer Showcase 2026";
    // Determine event time: Farm Tour = 9-11 AM, Harvests = 8-10 AM
    const eventTime = metadata.event_time || (eventName && eventName.includes('Farm Tour') ? '9:00 AM - 11:00 AM EST' : '8:00 AM - 10:00 AM EST');
    const eventVenue = metadata.event_venue || process.env.CLIENT_VENUE_NAME || 'TBA';
    const organizerName = metadata.organizer_name || process.env.ORGANIZER_NAME || 'Organizer Name';
    
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
    const eventSlug = `${(eventName || 'event').toLowerCase().replace(/\s+/g, '_')}_${(eventDate || '').replace(/-/g, '_')}`;

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
      eventSlug
    };

    // Step 1: Generate QR Code first (needed for Klaviyo event and database)
    console.log('📱 ===== STEP 1: GENERATING QR CODES =====');
    console.log('📱 Transaction ID:', transactionId);
    console.log('📱 Transaction ID type:', typeof transactionId);
    console.log('📱 Ticket Count:', ticketCount);
    console.log('📱 Customer Name:', customerName);
    
    let qrCodeUrl = null;
    let qrCodeData = null;
    try {
      qrCodeData = await generateQRCode(transactionId, metadataObj);
      qrCodeUrl = qrCodeData?.qrCodeUrl || null;
      
      console.log('✅ QR code generation completed');
      console.log('✅ QR code data has tickets:', !!(qrCodeData && qrCodeData.tickets));
      console.log('✅ Number of tickets in QR data:', qrCodeData?.tickets?.length || 0);
      
      if (qrCodeData && qrCodeData.tickets) {
        qrCodeData.tickets.forEach((ticket, idx) => {
          console.log(`📱 QR Ticket ${idx + 1}:`);
          console.log(`📱   Ticket ID: ${ticket.ticketId}`);
          console.log(`📱   Ticket Number: ${ticket.qrCodeData.ticketNumber}`);
          console.log(`📱   Has QR Code URL: ${!!ticket.qrCodeUrl}`);
        });
      }
    } catch (error) {
      console.error('❌ QR code generation failed (continuing):', error.message);
      console.error('❌ Error stack:', error.stack);
      // Continue even if QR code fails
    }

    // Step 1.5: Create ticket records in Supabase database
    console.log('💾 ===== CREATING TICKET RECORDS IN DATABASE =====');
    console.log('💾 Transaction ID:', transactionId);
    console.log('💾 Ticket Count:', ticketCount);
    console.log('💾 Has QR Code Data:', !!qrCodeData);
    console.log('💾 Has Tickets Array:', !!(qrCodeData && qrCodeData.tickets));
    
    try {
      if (qrCodeData && qrCodeData.tickets) {
        console.log('💾 Tickets to create:', qrCodeData.tickets.length);
        
        // Create a database record for each ticket
        for (let i = 0; i < qrCodeData.tickets.length; i++) {
          const ticketData = qrCodeData.tickets[i];
          
          console.log(`💾 Creating ticket ${i + 1} of ${qrCodeData.tickets.length}:`);
          console.log(`💾   Ticket ID from QR: ${ticketData.ticketId}`);
          console.log(`💾   Ticket ID type: ${typeof ticketData.ticketId}`);
          console.log(`💾   Ticket ID length: ${ticketData.ticketId?.length}`);
          console.log(`💾   Ticket Number: ${ticketData.qrCodeData.ticketNumber}`);
          console.log(`💾   Customer: ${customerName}`);
          console.log(`💾   QR Code URL exists: ${!!ticketData.qrCodeUrl}`);
          console.log(`💾   Validation URL in QR: ${ticketData.validationUrl?.substring(0, 100)}...`);
          
          // Extract ticketId from QR code validation URL to verify it matches
          if (ticketData.validationUrl) {
            const urlParams = new URLSearchParams(ticketData.validationUrl.split('?')[1]);
            const qrTicketId = urlParams.get('ticketId');
            console.log(`💾   Ticket ID in QR URL: ${qrTicketId}`);
            console.log(`💾   Ticket IDs match: ${ticketData.ticketId === qrTicketId}`);
          }
          
          try {
            const ticketRecord = await createTicket({
              ticketId: ticketData.ticketId,
              transactionId: transactionId,
              eventName: eventName,
              eventDate: eventDate,
              eventTime: eventTime,
              eventVenue: eventVenue,
              customerName: customerName,
              customerEmail: customerEmail,
              customerPhone: customerPhone || null,
              ticketCount: ticketCount,
              ticketNumber: ticketData.qrCodeData.ticketNumber,
              tier: tier,
              purchaseDate: purchaseDate,
              qrCodeUrl: ticketData.qrCodeUrl,
              checksum: ticketData.qrCodeData.checksum
            });

            console.log(`✅ ===== TICKET CREATED SUCCESSFULLY =====`);
            console.log(`✅ Ticket ${ticketData.qrCodeData.ticketNumber} of ${ticketCount}`);
            console.log(`✅ Database ticket_id: "${ticketRecord?.ticket_id}"`);
            console.log(`✅ QR code ticket_id: "${ticketData.ticketId}"`);
            console.log(`✅ IDs match exactly: ${ticketRecord?.ticket_id === ticketData.ticketId}`);
            console.log(`✅ IDs are same type: ${typeof ticketRecord?.ticket_id === typeof ticketData.ticketId}`);
            console.log(`✅ Database ticket_id length: ${ticketRecord?.ticket_id?.length}`);
            console.log(`✅ QR ticket_id length: ${ticketData.ticketId?.length}`);
            
            if (ticketRecord?.ticket_id !== ticketData.ticketId) {
              console.error('❌ ===== TICKET ID MISMATCH DETECTED =====');
              console.error('❌ This will cause "ticket not found" errors!');
              console.error('❌ Database has:', ticketRecord?.ticket_id);
              console.error('❌ QR code has:', ticketData.ticketId);
            }
            
            // VERIFY: Immediately try to look up the ticket we just created
            console.log('🔍 Verifying ticket can be found in database...');
            try {
              const { getTicketByTicketId } = require('./ticket-db');
              const verifyTicket = await getTicketByTicketId(ticketData.ticketId);
              if (verifyTicket) {
                console.log('✅ VERIFICATION SUCCESS: Ticket can be found immediately after creation');
                console.log('✅ Verified ticket_id:', verifyTicket.ticket_id);
              } else {
                console.error('❌ VERIFICATION FAILED: Ticket NOT found immediately after creation!');
                console.error('❌ This means the ticket was not actually saved to database');
              }
            } catch (verifyError) {
              console.error('❌ Verification lookup failed:', verifyError.message);
            }
            
            console.log(`✅ Full ticket record:`, JSON.stringify(ticketRecord, null, 2));
          } catch (ticketError) {
            console.error(`❌ Failed to create ticket ${i + 1}:`, {
              ticketId: ticketData.ticketId,
              error: ticketError.message,
              code: ticketError.code,
              fullError: JSON.stringify(ticketError, Object.getOwnPropertyNames(ticketError), 2)
            });
            // Continue with other tickets even if one fails
          }
        }
        console.log(`✅ All ${ticketCount} ticket(s) processed`);
      } else {
        console.warn('⚠️ No ticket data from QR code generation, skipping database creation');
        console.warn('⚠️ QR Code Data:', qrCodeData ? 'exists but no tickets array' : 'null/undefined');
      }
    } catch (error) {
      console.error('❌ ===== FATAL ERROR CREATING TICKETS =====');
      console.error('❌ Transaction ID:', transactionId);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      // Continue even if database creation fails - don't block email sending
    }

    // Step 2: Send event to Klaviyo for EACH ticket (each with unique QR code)
    console.log('📧 Step 2: Sending ticket.purchased events to Klaviyo (one per ticket)...');
    
    if (qrCodeData && qrCodeData.tickets && qrCodeData.tickets.length > 0) {
      // Send a separate Klaviyo event for each ticket with its own QR code
      for (let i = 0; i < qrCodeData.tickets.length; i++) {
        const ticketData = qrCodeData.tickets[i];
        const ticketQRCode = ticketData.qrCodeUrl; // Unique QR code for this ticket
        
        console.log(`📧 Sending Klaviyo event for ticket ${i + 1} of ${qrCodeData.tickets.length}:`);
        console.log(`📧   Ticket ID: ${ticketData.ticketId}`);
        console.log(`📧   Ticket Number: ${ticketData.qrCodeData.ticketNumber}`);
        console.log(`📧   Has QR Code: ${!!ticketQRCode}`);
        
        // Update metadata with this ticket's specific info
        const ticketMetadata = {
          ...metadataObj,
          qrCodeUrl: ticketQRCode, // Unique QR code for THIS ticket
          ticketId: ticketData.ticketId, // Add ticket ID to metadata
          ticketNumber: ticketData.qrCodeData.ticketNumber // Add ticket number
        };
        
        try {
          const klaviyoResult = await syncToKlaviyo(customerEmail, customerName, ticketMetadata, ticketQRCode);
          if (klaviyoResult.sent) {
            console.log(`✅ Klaviyo event sent successfully for ticket ${i + 1}`);
            if (klaviyoResult.warning) {
              console.warn(`⚠️ Klaviyo warning for ticket ${i + 1}:`, klaviyoResult.warning);
            }
          } else {
            console.warn(`⚠️ Klaviyo event not sent for ticket ${i + 1}:`, klaviyoResult.reason || 'Unknown reason');
          }
        } catch (error) {
          // Log the full error for debugging
          console.error(`❌ Klaviyo event failed for ticket ${i + 1}:`, {
            message: error.message,
            email: customerEmail,
            ticketId: ticketData.ticketId,
            transactionId: transactionId,
            errorStack: error.stack
          });
          
          // Check if it's a recoverable error (profile exists, etc.)
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('already exists') || 
              errorMessage.includes('duplicate') ||
              errorMessage.includes('profile')) {
            console.warn(`⚠️ Profile may already exist for ticket ${i + 1} - Flow should still trigger if configured correctly`);
          }
          
          // Continue with other tickets even if one fails
        }
      }
      console.log(`✅ All ${qrCodeData.tickets.length} Klaviyo event(s) processed`);
    } else {
      console.warn('⚠️ No ticket data available for Klaviyo events');
    }

    // Note: Revenue split is now handled automatically via application_fee_amount
    // configured in stripe-payment.js. No manual transfers needed.

    console.log('✅ Post-payment flow completed for session:', session.id);

  } catch (error) {
    console.error('❌ Error in handleCheckoutCompleted:', error);
    // Don't throw - we want to return 200 to Stripe
  }
}

/**
 * Send ticket.purchased event to Klaviyo
 * Triggers Klaviyo Flows configured for this event
 * Uses Klaviyo REST API v2024-07-15
 */
async function syncToKlaviyo(email, name, metadata, qrCodeUrl) {
  if (!email) {
    throw new Error('Email is required for Klaviyo sync');
  }

  if (!KLAVIYO_PRIVATE_KEY) {
    console.warn('⚠️ KLAVIYO_PRIVATE_KEY not configured - skipping Klaviyo event');
    return { sent: false, reason: 'No API key' };
  }

  // Parse name into first/last
  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Convert amount string to number (remove dollar sign and parse as float)
  const amountNumeric = metadata.amountFormatted 
    ? parseFloat(metadata.amountFormatted.replace(/[^0-9.]/g, '')) 
    : 0;

  // Build event payload
  // Note: Klaviyo will automatically create/update the profile if it doesn't exist
  // Including profile data in the event is the recommended approach
  const payload = {
    data: {
      type: 'event',
      attributes: {
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
          event_name: metadata.eventName,
          event_date: metadata.eventDate,
          event_time: metadata.eventTime,
          event_venue: metadata.eventVenue,
          ticket_count: metadata.ticketCount,
          ticket_id: metadata.ticketId || null, // Individual ticket ID (unique per ticket)
          ticket_number: metadata.ticketNumber || null, // Ticket number (1, 2, 3...)
          tier: metadata.tier,
          amount: amountNumeric,
          qr_code_url: qrCodeUrl || null, // Unique QR code for THIS specific ticket
          event_slug: metadata.eventSlug,
          organizer_name: metadata.organizerName,
          customer_name: metadata.customerName,
          purchase_date: metadata.purchaseDate
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
    console.log('🔍 Sending Klaviyo event:', {
      email,
      metric: 'ticket.purchased',
      transactionId: metadata.transactionId
    });

    const response = await axios.post(
      KLAVIYO_API_URL,
      payload,
      {
        headers: {
          'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
          'revision': KLAVIYO_REVISION,
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging
        timeout: 10000
      }
    );

    console.log('✅ Klaviyo event sent successfully:', {
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
      
      console.error('❌ Klaviyo API error:', {
        status: status,
        statusText: error.response.statusText,
        data: JSON.stringify(errorData, null, 2),
        email,
        url: KLAVIYO_API_URL,
        hasApiKey: !!KLAVIYO_PRIVATE_KEY,
        apiKeyPrefix: KLAVIYO_PRIVATE_KEY ? KLAVIYO_PRIVATE_KEY.substring(0, 10) : 'missing'
      });
      console.error('❌ Payload sent:', JSON.stringify(payload, null, 2));
      
      // Handle specific error cases
      // 400 Bad Request - might be validation error, but profile might still exist
      // 409 Conflict - resource already exists (shouldn't happen with events, but handle it)
      // 422 Unprocessable Entity - validation error
      // For these cases, the profile likely exists, so we should still consider it a success
      // and let the Flow trigger if possible
      
      if (status === 400 || status === 409 || status === 422) {
        // Check if error is about existing profile/email
        const errorMessage = JSON.stringify(errorData).toLowerCase();
        if (errorMessage.includes('already exists') || 
            errorMessage.includes('duplicate') ||
            errorMessage.includes('profile')) {
          console.warn('⚠️ Klaviyo profile may already exist, but event should still trigger Flow');
          // Return success-like response - the event might still be processed
          // Klaviyo Flows can trigger on events even if profile creation had issues
          return { sent: true, eventId: null, warning: 'Profile may already exist' };
        }
      }
      
      // For other errors, still throw but with more context
      throw new Error(`Klaviyo API error (${status}): ${JSON.stringify(errorData)}`);
    } else {
      console.error('❌ Klaviyo request error:', error.message);
      throw error;
    }
  }
}

/**
 * Generate QR code for ticket
 * Returns data URL (base64 string) that can be embedded in email
 * QR code contains a URL that points to validation endpoint
 */
async function generateQRCode(transactionId, metadata) {
  if (!transactionId) {
    throw new Error('Transaction ID is required for QR code generation');
  }

  // Get base URL from environment or use default
  const baseUrl = process.env.BASE_URL || 'https://itll-happen-boyz.eventbrella.us';

    // Generate unique ticket ID for each ticket
    const tickets = [];
    for (let i = 0; i < metadata.ticketCount; i++) {
      const ticketNumber = i + 1;
      const ticketId = `TKT_${transactionId}_${ticketNumber}`;
      
      // Generate checksum for validation
      const checksum = generateChecksum(ticketId, transactionId, metadata.customerName);
      
      // Create validation URL with all purchaser data encoded in query params
      // This URL will be what the QR code contains - includes all tracking data
      const validationUrl = `${baseUrl}/api/validate-ticket?ticketId=${encodeURIComponent(ticketId)}&transactionId=${encodeURIComponent(transactionId)}&checksum=${encodeURIComponent(checksum)}&eventName=${encodeURIComponent(metadata.eventName || 'Farm Tour')}&eventDate=${encodeURIComponent(metadata.eventDate || '')}&eventTime=${encodeURIComponent(metadata.eventTime || '')}&customerName=${encodeURIComponent(metadata.customerName || '')}&customerEmail=${encodeURIComponent(metadata.customerEmail || '')}&customerPhone=${encodeURIComponent(metadata.customerPhone || '')}&ticketCount=${encodeURIComponent(metadata.ticketCount || 1)}&ticketNumber=${encodeURIComponent(ticketNumber)}&purchaseDate=${encodeURIComponent(metadata.purchaseDate || '')}`;

      // Create QR code data structure (for reference, stored in metadata)
      const qrData = {
        ticketId: ticketId,
        transactionId: transactionId,
        eventName: metadata.eventName || process.env.CLIENT_DEFAULT_EVENT_NAME || "Summer Showcase 2026",
        eventDate: metadata.eventDate || null,
        eventTime: metadata.eventTime || (metadata.eventName && metadata.eventName.includes('Farm Tour') ? '9:00 AM - 11:00 AM EST' : '8:00 AM - 10:00 AM EST'),
        eventVenue: metadata.eventVenue || process.env.CLIENT_VENUE_NAME || 'TBA',
        organizerName: metadata.organizerName || process.env.ORGANIZER_NAME || 'Organizer Name',
        tier: metadata.tier,
        purchaseDate: metadata.purchaseDate,
        customerName: metadata.customerName,
        ticketNumber: ticketNumber,
        ticketCount: metadata.ticketCount,
        checksum: checksum,
        version: '1.0',
        source: process.env.CLIENT_SOURCE_ID || 'eventbrella_ticketing'
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

  const TEST_MODE = process.env.TEST_MODE === 'true' || !apiKey;

  if (TEST_MODE) {
    console.log('🧪 TEST MODE: Mocking Klaviyo email event');
    console.log('📨 [EMAIL LOG] Would trigger Klaviyo event:', {
      to: email,
      eventName: 'Ticket Purchased',
      subject: `${process.env.CLIENT_VENUE_NAME || 'TBA'} - ${data.eventName || 'Event'}`,
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
    // The Flow should be set up in Klaviyo dashboard to listen for "Ticket Purchased" event
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
            name: 'Ticket Purchased'
          },
          properties: {
            event_name: data.eventName || process.env.CLIENT_DEFAULT_EVENT_NAME || "Summer Showcase 2026",
            event_date: data.eventDate,
            event_time: data.eventTime || (data.eventName && data.eventName.includes('Farm Tour') ? '9:00 AM - 11:00 AM EST' : '8:00 AM - 10:00 AM EST'),
            venue_name: data.eventVenue || process.env.CLIENT_VENUE_NAME || 'TBA',
            venue_address: data.venueAddress || '',
            ticket_quantity: data.ticketCount || 1,
            ticket_type: data.tier,
            qr_code_url: data.qrCodeUrl || null,
            transaction_id: data.transactionId,
            total_price: data.amountFormatted ? parseFloat(data.amountFormatted) : 0,
            customer_name: name,
            organizer_name: data.organizerName || process.env.ORGANIZER_NAME || 'Organizer Name',
            event_slug: data.eventSlug || process.env.CLIENT_EVENT_SLUG || 'summer-showcase-2026',
            ticket_number: data.ticketNumber || 1,
            purchase_date: data.purchaseDate
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
        eventName: 'Ticket Purchased'
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

// Only for testing — sends Ticket Purchased event to Klaviyo
if (require.main === module) {
  const testPayload = {
    data: {
      type: "event",
      attributes: {
        metric: { data: { type: "metric", attributes: { name: "Ticket Purchased" } } },
        properties: {
          eventSlug: process.env.CLIENT_EVENT_SLUG || "summer-showcase-2026",
          eventName: process.env.CLIENT_DEFAULT_EVENT_NAME || "Summer Showcase 2026",
          eventDate: "2026-01-03",
          eventTime: "8:00 AM - 10:00 AM EST",
          eventVenue: process.env.CLIENT_VENUE_NAME || "TBA",
          organizerName: process.env.ORGANIZER_NAME || "Organizer Name",
          transactionId: "TXN_TEST_001",
          ticketCount: 1,
          ticketNumber: 1,
          tier: "basic",
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
    eventSlug: process.env.CLIENT_EVENT_SLUG || "summer-showcase-2026",
    eventName: process.env.CLIENT_DEFAULT_EVENT_NAME || "Summer Showcase 2026",
    eventDate: "2026-01-03",
    eventTime: "8:00 AM - 10:00 AM EST",
    eventVenue: process.env.CLIENT_VENUE_NAME || "TBA",
    organizerName: process.env.ORGANIZER_NAME || "Organizer Name",
    transactionId: "TXN_TEST_001",
    ticketCount: 1,
    ticketNumber: 1,
    tier: "basic",
    amountFormatted: "20.00",
    qrCodeUrl: "data:image/png;base64,...",
    purchaseDate: new Date().toISOString()
  };

  sendConfirmationEmail(testEmail, testName, testData)
    .then(() => console.log("✅ Test event sent to Klaviyo"))
    .catch((err) => console.error(err));
}

// Disable Vercel's automatic body parsing for Stripe webhook signature verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
