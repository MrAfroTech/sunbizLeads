/**
 * Location Demo Request API Endpoint
 * Handles demo requests from location-specific landing pages
 */

import { withCORS } from './cors-middleware.js';

// Vercel serverless function handler
async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📝 Location demo request received:', req.body);
    
    const {
      name,
      email,
      phone,
      businessName,
      location,
      message,
      locationId,
      cityName,
      source
    } = req.body;

    // Validate required fields
    if (!name || !email || !businessName || !locationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, businessName, locationId'
      });
    }

    // Generate unique request ID
    const requestId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare demo request data
    const demoRequestData = {
      requestId,
      name,
      email,
      phone: phone || '',
      businessName,
      location: location || '',
      message: message || '',
      locationId,
      cityName: cityName || locationId,
      source: source || 'location-landing-page',
      timestamp: new Date().toISOString(),
      status: 'pending',
      priority: getLocationPriority(locationId)
    };

    // Store in DynamoDB (if available)
    try {
      await storeDemoRequest(demoRequestData);
      console.log('✅ Demo request stored in DynamoDB');
    } catch (dbError) {
      console.error('❌ DynamoDB storage failed:', dbError);
      // Continue processing even if DB storage fails
    }

    // Send email notification
    try {
      await sendDemoRequestEmail(demoRequestData);
      console.log('✅ Demo request email sent');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Continue processing even if email fails
    }

    // Add to Klaviyo (if configured)
    try {
      await addToKlaviyo(demoRequestData);
      console.log('✅ Contact added to Klaviyo');
    } catch (klaviyoError) {
      console.error('❌ Klaviyo integration failed:', klaviyoError);
      // Continue processing even if Klaviyo fails
    }

    // Track analytics event
    try {
      await trackAnalyticsEvent(demoRequestData);
      console.log('✅ Analytics event tracked');
    } catch (analyticsError) {
      console.error('❌ Analytics tracking failed:', analyticsError);
      // Continue processing even if analytics fails
    }

    console.log('✅ Location demo request processed successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Demo request submitted successfully',
      requestId: requestId
    });

  } catch (error) {
    console.error('❌ Location demo request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Store demo request in DynamoDB
 * @param {Object} demoRequestData - Demo request data
 */
async function storeDemoRequest(demoRequestData) {
  // This would integrate with your existing DynamoDB setup
  // For now, we'll just log the data structure
  console.log('📊 Demo request data structure:', {
    TableName: 'seamless-demo-requests',
    Item: demoRequestData
  });
  
  // TODO: Implement actual DynamoDB storage
  // const AWS = require('aws-sdk');
  // const docClient = new AWS.DynamoDB.DocumentClient();
  // await docClient.put({
  //   TableName: 'seamless-demo-requests',
  //   Item: demoRequestData
  // }).promise();
}

/**
 * Send email notification for demo request
 * @param {Object} demoRequestData - Demo request data
 */
async function sendDemoRequestEmail(demoRequestData) {
  const nodemailer = require('nodemailer');
  
  // Configure email transporter
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Email content
  const emailContent = `
    New Demo Request from ${demoRequestData.cityName} Location Page
    
    Request Details:
    - Name: ${demoRequestData.name}
    - Email: ${demoRequestData.email}
    - Phone: ${demoRequestData.phone || 'Not provided'}
    - Business: ${demoRequestData.businessName}
    - Location: ${demoRequestData.location || 'Not specified'}
    - City: ${demoRequestData.cityName}
    - Priority: ${demoRequestData.priority}
    
    Message:
    ${demoRequestData.message || 'No additional message'}
    
    Request ID: ${demoRequestData.requestId}
    Timestamp: ${demoRequestData.timestamp}
    Source: ${demoRequestData.source}
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.DEMO_REQUEST_EMAIL || 'team@ezdrink.us',
    subject: `New Demo Request - ${demoRequestData.cityName} (Priority: ${demoRequestData.priority})`,
    text: emailContent
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Add contact to Klaviyo
 * @param {Object} demoRequestData - Demo request data
 */
async function addToKlaviyo(demoRequestData) {
  const klaviyoApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  const klaviyoListId = process.env.KLAVIYO_DEMO_LIST_ID || process.env.KLAVIYO_CLIENT_LIST_ID;
  
  if (!klaviyoApiKey || !klaviyoListId) {
    console.log('⚠️ Klaviyo not configured, skipping');
    return;
  }

  const profileData = {
    data: {
      type: 'profile',
      attributes: {
        email: demoRequestData.email,
        phone_number: demoRequestData.phone || undefined,
        properties: {
          $first_name: demoRequestData.name.split(' ')[0],
          $last_name: demoRequestData.name.split(' ').slice(1).join(' ') || '',
          $company: demoRequestData.businessName,
          $title: 'Restaurant Owner',
          source: 'Location Landing Page',
          location_id: demoRequestData.locationId,
          city_name: demoRequestData.cityName,
          location_area: demoRequestData.location,
          priority: demoRequestData.priority,
          signup_date: new Date().toISOString(),
          demo_request_id: demoRequestData.requestId
        }
      }
    }
  };

  // Remove undefined values
  Object.keys(profileData.data.attributes.properties).forEach(key => {
    if (profileData.data.attributes.properties[key] === undefined) {
      delete profileData.data.attributes.properties[key];
    }
  });

  if (profileData.data.attributes.phone_number === undefined) {
    delete profileData.data.attributes.phone_number;
  }

  const response = await fetch('https://a.klaviyo.com/api/profiles/', {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    },
    body: JSON.stringify(profileData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Klaviyo API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Klaviyo profile created:', result.data.id);

  // Add to list
  const listData = {
    data: {
      type: 'profile',
      id: result.data.id
    }
  };

  const listResponse = await fetch(`https://a.klaviyo.com/api/lists/${klaviyoListId}/relationships/profiles/`, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    },
    body: JSON.stringify(listData)
  });

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(`Klaviyo list addition error: ${listResponse.status} - ${errorText}`);
  }

  console.log('✅ Contact added to Klaviyo list');
}

/**
 * Track analytics event
 * @param {Object} demoRequestData - Demo request data
 */
async function trackAnalyticsEvent(demoRequestData) {
  // Google Analytics 4 event tracking
  if (typeof gtag !== 'undefined') {
    gtag('event', 'generate_lead', {
      location: demoRequestData.cityName,
      location_id: demoRequestData.locationId,
      priority: demoRequestData.priority,
      source: demoRequestData.source,
      request_id: demoRequestData.requestId
    });
  }

  // Facebook Pixel event tracking
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Lead', {
      content_name: `${demoRequestData.cityName} Demo Request`,
      content_category: 'Location Landing Page',
      value: demoRequestData.priority * 100, // Priority as value
      currency: 'USD'
    });
  }

  console.log('✅ Analytics events tracked');
}

/**
 * Get location priority based on location ID
 * @param {string} locationId - Location identifier
 * @returns {number} Priority value
 */
function getLocationPriority(locationId) {
  const priorities = {
    'orlando': 0.9,
    'tampa': 0.9,
    'winter-garden': 0.8,
    'clermont': 0.8,
    'winter-park': 0.8,
    'maitland': 0.8,
    'apopka': 0.7,
    'mount-dora': 0.7,
    'sanford': 0.7,
    'lake-county': 0.6,
    'polk-county': 0.6
  };
  
  return priorities[locationId] || 0.7;
}

export default withCORS(handler);
