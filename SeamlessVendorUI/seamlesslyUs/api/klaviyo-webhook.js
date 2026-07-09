// api/klaviyo-webhook.js - Updated for Flow Webhooks (no signature verification)
const axios = require('axios');

// Import automation services
const automationService = require('../services/klaviyoAutomationService');
const customerService = require('../services/customerService');
const engagementService = require('../services/engagementService');

// Import CORS middleware
const { withCORS } = require('./cors-middleware');

async function handler(req, res) {

  console.log('🔔 Klaviyo Flow webhook received');

  try {
    // For Flow webhooks, we don't verify signatures
    // Instead, we can verify the source IP if needed (optional)
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`📡 Webhook from IP: ${clientIP}`);

    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      console.error('❌ Invalid webhook payload structure');
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Process each event in the webhook
    for (const event of data) {
      await processKlaviyoEvent(event);
    }

    console.log('✅ Klaviyo webhook processed successfully');
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Klaviyo webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

/**
 * Process individual Klaviyo events
 */
async function processKlaviyoEvent(event) {
  const { type, attributes, relationships } = event;
  
  console.log(`📊 Processing Klaviyo event: ${type}`);

  try {
    switch (type) {
      case 'profile.subscribed':
        await handleProfileSubscribed(attributes, relationships);
        break;
      
      case 'profile.unsubscribed':
        await handleProfileUnsubscribed(attributes, relationships);
        break;
      
      case 'profile.updated':
        await handleProfileUpdated(attributes, relationships);
        break;
      
      case 'list.subscribed':
        await handleListSubscribed(attributes, relationships);
        break;
      
      case 'list.unsubscribed':
        await handleListUnsubscribed(attributes, relationships);
        break;
      
      case 'email.opened':
        await handleEmailOpened(attributes, relationships);
        break;
      
      case 'email.clicked':
        await handleEmailClicked(attributes, relationships);
        break;
      
      case 'sms.sent':
        await handleSmsSent(attributes, relationships);
        break;
      
      case 'sms.delivered':
        await handleSmsDelivered(attributes, relationships);
        break;
      
      case 'sms.failed':
        await handleSmsFailed(attributes, relationships);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${type}`);
    }
  } catch (error) {
    console.error(`❌ Error processing event ${type}:`, error);
    // Don't throw - continue processing other events
  }
}

/**
 * Handle new profile subscription (main funnel trigger)
 */
async function handleProfileSubscribed(attributes, relationships) {
  console.log('🎯 New profile subscribed - triggering sales funnel');
  
  const customerData = {
    email: attributes.email,
    phone: attributes.phone_number,
    firstName: attributes.first_name,
    lastName: attributes.last_name,
    properties: attributes.properties || {},
    klaviyoProfileId: relationships?.profile?.data?.id,
    subscribedAt: new Date().toISOString(),
    source: attributes.properties?.source || 'klaviyo_webhook'
  };

  // Store/update customer in database
  const customer = await customerService.createOrUpdateCustomer(customerData);
  
  // Initialize engagement scoring
  await engagementService.initializeEngagementScore(customer.id);
  
  // Trigger welcome sequence via Klaviyo API
  await automationService.triggerWelcomeSequenceViaAPI(customer);
  
  console.log(`✅ Welcome sequence triggered for ${customer.email}`);
}

/**
 * Handle list subscription (vendor signup list)
 */
async function handleListSubscribed(attributes, relationships) {
  const listId = relationships?.list?.data?.id;
  const profileId = relationships?.profile?.data?.id;
  
  console.log(`📋 Profile ${profileId} subscribed to list ${listId}`);
  
  // Check if this is our vendor signup list
  if (listId === process.env.KLAVIYO_LIST_ID) {
    console.log('🎯 Vendor signup list subscription detected');
    
    // Get customer data
    const customer = await customerService.getCustomerByKlaviyoProfileId(profileId);
    
    if (customer) {
      // Update customer with list subscription
      await customerService.updateCustomer(customer.id, {
        vendorSignupListSubscribed: true,
        vendorSignupListSubscribedAt: new Date().toISOString()
      });
      
      // Trigger vendor-specific onboarding sequence via API
      await automationService.triggerVendorOnboardingSequenceViaAPI(customer);
    }
  }
}

/**
 * Handle email engagement events
 */
async function handleEmailOpened(attributes, relationships) {
  const profileId = relationships?.profile?.data?.id;
  const campaignId = relationships?.campaign?.data?.id;
  
  console.log(`📧 Email opened - Profile: ${profileId}, Campaign: ${campaignId}`);
  
  // Update engagement score
  await engagementService.updateEngagementScore(profileId, 'email_opened', {
    campaignId,
    timestamp: new Date().toISOString()
  });
}

async function handleEmailClicked(attributes, relationships) {
  const profileId = relationships?.profile?.data?.id;
  const campaignId = relationships?.campaign?.data?.id;
  
  console.log(`🔗 Email clicked - Profile: ${profileId}, Campaign: ${campaignId}`);
  
  // Update engagement score
  await engagementService.updateEngagementScore(profileId, 'email_clicked', {
    campaignId,
    linkUrl: attributes.url,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle SMS events
 */
async function handleSmsSent(attributes, relationships) {
  const profileId = relationships?.profile?.data?.id;
  console.log(`📱 SMS sent - Profile: ${profileId}`);
  
  await engagementService.updateEngagementScore(profileId, 'sms_sent', {
    timestamp: new Date().toISOString()
  });
}

async function handleSmsDelivered(attributes, relationships) {
  const profileId = relationships?.profile?.data?.id;
  console.log(`✅ SMS delivered - Profile: ${profileId}`);
  
  await engagementService.updateEngagementScore(profileId, 'sms_delivered', {
    timestamp: new Date().toISOString()
  });
}

async function handleSmsFailed(attributes, relationships) {
  const profileId = relationships?.profile?.data?.id;
  console.log(`❌ SMS failed - Profile: ${profileId}`);
  
  await engagementService.updateEngagementScore(profileId, 'sms_failed', {
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle profile updates
 */
async function handleProfileUpdated(attributes, relationships) {
  const profileId = relationships?.profile?.data?.id;
  console.log(`🔄 Profile updated - Profile: ${profileId}`);
  
  // Update customer data in database
  const customer = await customerService.getCustomerByKlaviyoProfileId(profileId);
  
  if (customer) {
    await customerService.updateCustomer(customer.id, {
      email: attributes.email,
      phone: attributes.phone_number,
      firstName: attributes.first_name,
      lastName: attributes.last_name,
      properties: attributes.properties || {},
      updatedAt: new Date().toISOString()
    });
  }
}

/**
 * Handle unsubscription events
 */
async function handleProfileUnsubscribed(attributes, relationships) {
  const profileId = relationships?.profile?.data?.id;
  console.log(`🚫 Profile unsubscribed - Profile: ${profileId}`);
  
  // Update customer status
  const customer = await customerService.getCustomerByKlaviyoProfileId(profileId);
  
  if (customer) {
    await customerService.updateCustomer(customer.id, {
      unsubscribed: true,
      unsubscribedAt: new Date().toISOString()
    });
  }
}

async function handleListUnsubscribed(attributes, relationships) {
  const listId = relationships?.list?.data?.id;
  const profileId = relationships?.profile?.data?.id;
  
  console.log(`📋 Profile ${profileId} unsubscribed from list ${listId}`);
  
  // Handle list-specific unsubscription logic
  if (listId === process.env.KLAVIYO_LIST_ID) {
    const customer = await customerService.getCustomerByKlaviyoProfileId(profileId);
    
    if (customer) {
      await customerService.updateCustomer(customer.id, {
        vendorSignupListUnsubscribed: true,
        vendorSignupListUnsubscribedAt: new Date().toISOString()
      });
    }
  }
} 

// Export the handler wrapped with CORS middleware
module.exports = withCORS(handler); 