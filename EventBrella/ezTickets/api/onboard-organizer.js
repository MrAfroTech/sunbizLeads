// api/onboard-organizer.js - Stripe Connect onboarding link for organizers
//
// This endpoint creates (or prepares to create) a Stripe Connect Express account
// for an event organizer and returns an onboarding URL where they can enter
// their banking and tax information.
//
// NOTE: This implementation does NOT persist organizer data to a database yet.
// It is designed to be wired into your real data layer later. For now, it
// expects organizer details in the request body and returns the Stripe
// onboarding link so you can manually give it to the organizer.

const TEST_MODE = process.env.TEST_MODE === 'true' || !process.env.STRIPE_SECRET_KEY;
const stripe = TEST_MODE ? null : require('stripe')(process.env.STRIPE_SECRET_KEY || '');

// Base URL for your app (used for return/refresh URLs)
const BASE_URL = process.env.BASE_URL || 'https://CLIENT_SUBDOMAIN.eventbrella.us';

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('🏦 Stripe Connect Onboard Organizer API called');
  console.log(`🧪 Test Mode: ${TEST_MODE}`);

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  try {
    const {
      organizerEmail,
      organizerId,
      businessName
    } = req.body || {};

    if (!organizerEmail || !organizerId || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: organizerEmail, organizerId, businessName'
      });
    }

    // In TEST_MODE we do not hit Stripe; just simulate
    if (TEST_MODE) {
      console.log('🧪 TEST MODE: Mocking Stripe Connect onboarding link');
      const mockAccountId = `acct_test_${organizerId}`;
      const mockOnboardingUrl = `${BASE_URL}/organizer/connect/mock-onboarding?organizerId=${encodeURIComponent(
        organizerId
      )}&accountId=${encodeURIComponent(mockAccountId)}`;

      // In a real implementation, you would persist mockAccountId to your DB here.
      console.log('✅ Mock Connect account created (not persisted):', {
        organizerId,
        organizerEmail,
        businessName,
        accountId: mockAccountId
      });

      return res.status(200).json({
        success: true,
        testMode: true,
        message: 'Stripe Connect onboarding link (TEST MODE)',
        data: {
          accountId: mockAccountId,
          onboardingUrl: mockOnboardingUrl
        }
      });
    }

    // PRODUCTION MODE: Create a real Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: organizerEmail,
      business_type: 'individual', // or 'company' if applicable
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_profile: {
        name: businessName,
        product_description: 'Event ticket sales'
      },
      metadata: {
        organizer_id: organizerId,
        source: process.env.CLIENT_SOURCE_ID || 'eventbrella_ticketing'
      }
    });

    console.log('✅ Stripe Connect account created:', {
      organizerId,
      organizerEmail,
      businessName,
      accountId: account.id
    });

    // TODO: Persist account.id (stripeAccountId) to your organizers table here

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${BASE_URL}/organizer/connect/refresh?organizerId=${encodeURIComponent(
        organizerId
      )}`,
      return_url: `${BASE_URL}/organizer/connect/success?organizerId=${encodeURIComponent(
        organizerId
      )}`,
      type: 'account_onboarding'
    });

    console.log('🔗 Stripe Connect onboarding link generated:', {
      organizerId,
      accountId: account.id,
      onboardingUrl: accountLink.url
    });

    return res.status(200).json({
      success: true,
      testMode: false,
      message: 'Stripe Connect onboarding link created successfully',
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url
      }
    });
  } catch (error) {
    console.error('❌ Stripe Connect Onboard Organizer API error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


