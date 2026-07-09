// Vendor Management Lambda Handler
// Handles vendor data storage and WebSocket broadcasting

const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

// Environment variables
const VENDORS_TABLE = process.env.VENDORS_TABLE || 'ezdrink-vendors';
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

/**
 * CORS helper function to get appropriate Access-Control-Allow-Origin header
 */
function getCorsOrigin(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin;
  
  // Allow specific production domain
  if (origin === 'https://seamlessly.us' || origin === 'https://www.seamlessly.us') {
    return origin;
  }
  
  // Allow Vercel deployments (wildcard pattern)
  if (origin && origin.includes('vercel.app')) {
    return origin;
  }
  
  // Default to production domain for other cases
  return 'https://seamlessly.us';
}

/**
 * Get CORS headers for the response
 */
function getCorsHeaders(event) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// Store new vendor after Square OAuth success
async function storeVendor(vendorData) {
  const timestamp = new Date().toISOString();
  
  const vendor = {
    merchantId: vendorData.merchantId,
    businessName: vendorData.businessName,
    email: vendorData.email,
    phone: vendorData.phone,
    status: 'inactive', // Default to inactive until admin approves
    squareConnected: true,
    squareConnectedAt: timestamp,
    createdAt: timestamp,
    lastUpdated: timestamp,
    posSystem: 'square',
    // Store Square tokens securely (consider using AWS Secrets Manager in production)
    squareAccessToken: vendorData.accessToken,
    squareRefreshToken: vendorData.refreshToken
  };

  try {
    await dynamodb.put({
      TableName: VENDORS_TABLE,
      Item: vendor
    }).promise();

    console.log(`Vendor stored successfully: ${vendor.merchantId}`);
    return vendor;
  } catch (error) {
    console.error('Error storing vendor:', error);
    throw error;
  }
}

// Broadcast vendor event to all connected Customer UI clients
async function broadcastVendorEvent(eventType, vendorData) {
  try {
    // Get all active WebSocket connections (you'll need to implement connection tracking)
    // For now, we'll broadcast to a known connection or use a different approach
    
    const message = {
      type: eventType,
      timestamp: new Date().toISOString(),
      vendor: {
        merchantId: vendorData.merchantId,
        businessName: vendorData.businessName,
        status: vendorData.status,
        posSystem: vendorData.posSystem
      }
    };

    // For MVP, we'll use a simple broadcast approach
    // In production, you'd want to track active connections and broadcast to specific clients
    
    console.log(`Broadcasting ${eventType}:`, message);
    
    // TODO: Implement actual WebSocket broadcasting
    // This will be connected to your WebSocket API Gateway
    
    return true;
  } catch (error) {
    console.error('Error broadcasting vendor event:', error);
    throw error;
  }
}

// Handle new vendor registration
async function handleNewVendor(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { merchantId, businessName, email, phone, accessToken, refreshToken } = body;

    if (!merchantId || !businessName || !email) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: 'Missing required vendor data' })
      };
    }

    // Store vendor in DynamoDB
    const vendor = await storeVendor({
      merchantId,
      businessName,
      email,
      phone,
      accessToken,
      refreshToken
    });

    // Broadcast to Customer UI
    await broadcastVendorEvent('VENDOR_ADDED', vendor);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        success: true,
        message: 'Vendor registered successfully',
        vendor: {
          merchantId: vendor.merchantId,
          businessName: vendor.businessName,
          status: vendor.status
        }
      })
    };

  } catch (error) {
    console.error('Error handling new vendor:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ 
        error: 'Failed to register vendor',
        details: error.message 
      })
    };
  }
}

// Update vendor status (admin function)
async function updateVendorStatus(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { merchantId, status } = body;

    if (!merchantId || !status || !['active', 'inactive'].includes(status)) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event),
        body: JSON.stringify({ error: 'Invalid status or missing merchant ID' })
      };
    }

    // Update vendor status in DynamoDB
    const result = await dynamodb.update({
      TableName: VENDORS_TABLE,
      Key: { merchantId },
      UpdateExpression: 'SET #status = :status, lastUpdated = :timestamp',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':timestamp': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    const updatedVendor = result.Attributes;

    // Broadcast status change to Customer UI
    await broadcastVendorEvent('VENDOR_STATUS_CHANGED', updatedVendor);

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        success: true,
        message: 'Vendor status updated successfully',
        vendor: {
          merchantId: updatedVendor.merchantId,
          businessName: updatedVendor.businessName,
          status: updatedVendor.status
        }
      })
    };

  } catch (error) {
    console.error('Error updating vendor status:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ 
        error: 'Failed to update vendor status',
        details: error.message 
      })
    };
  }
}

// Get all active vendors (for Customer UI)
async function getActiveVendors(event) {
  try {
    const result = await dynamodb.scan({
      TableName: VENDORS_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'active'
      }
    }).promise();

    const vendors = result.Items.map(vendor => ({
      merchantId: vendor.merchantId,
      businessName: vendor.businessName,
      posSystem: vendor.posSystem,
      squareConnected: vendor.squareConnected,
      lastUpdated: vendor.lastUpdated
    }));

    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: JSON.stringify({
        success: true,
        vendors,
        count: vendors.length
      })
    };

  } catch (error) {
    console.error('Error getting active vendors:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ 
        error: 'Failed to get vendors',
        details: error.message 
      })
    };
  }
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('=== VENDOR MANAGEMENT LAMBDA ===');
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: ''
    };
  }

  const path = event.rawPath || event.path || '';
  const method = event.httpMethod || 'GET';

  try {
    // Route requests based on path and method
    if (path === '/vendors' && method === 'POST') {
      return await handleNewVendor(event);
    }
    
    if (path === '/vendors/status' && method === 'PUT') {
      return await updateVendorStatus(event);
    }
    
    if (path === '/vendors/active' && method === 'GET') {
      return await getActiveVendors(event);
    }

    // Default response
    return {
      statusCode: 404,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ 
        error: 'Endpoint not found',
        available_endpoints: [
          'POST /vendors',
          'PUT /vendors/status',
          'GET /vendors/active'
        ]
      })
    };

  } catch (error) {
    console.error('Lambda handler error:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event),
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
