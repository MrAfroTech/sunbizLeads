const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS SDK v3
const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

// DynamoDB table name for storing vendor updates
const VENDOR_UPDATES_TABLE = process.env.VENDOR_UPDATES_TABLE || 'vendor-updates-table';

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
    'Access-Control-Allow-Origin': getCorsOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };
}

/**
 * Main Lambda handler for customer bridge API
 */
exports.handler = async (event, context) => {
  console.log('=== CUSTOMER BRIDGE LAMBDA START ===');
  console.log('🔍 INCOMING EVENT ANALYSIS:');
  console.log('   - Event type:', typeof event);
  console.log('   - Event is null/undefined:', !event);
  console.log('   - Event keys:', event ? Object.keys(event) : 'N/A');
  console.log('   - Full event:', JSON.stringify(event, null, 2));
  
  try {
    let result;
    
    // Check if this is an EventBridge event (has source OR detail-type fields)
    if (event && (event.source || event['detail-type'])) {
      console.log('🔍 MAIN HANDLER: Routing to EventBridge handler');
      console.log('   - Event has source:', event.source);
      console.log('   - Event has detail-type:', event['detail-type']);
      console.log('   - Event has detail:', !!event.detail);
      result = await handleEventBridgeVendorEvent(event);
    }
    // Check if this is an HTTP API Gateway event OR Function URL event
    else if (event && (event.requestContext && event.requestContext.http || event.httpMethod)) {
      console.log('🔍 MAIN HANDLER: Routing to HTTP handler');
      console.log(`   - HTTP Method: ${event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method) || 'N/A'}`);
      console.log(`   - Path: ${event.path || event.rawPath || 'N/A'}`);
      result = await handleHttpRequest(event);
    }
    // Check if this is a null/undefined event
    else if (!event) {
      console.log('🔍 MAIN HANDLER: Null/undefined event detected');
      console.log('   - Event value:', event);
      console.log('   - Event type:', typeof event);
      result = {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid EventBridge event structure',
          received: event,
          expected: 'EventBridge event object with source, detail-type, and detail fields'
        })
      };
    }
    // Unknown event type
    else {
      console.log('🔍 MAIN HANDLER: Unknown event type detected');
      console.log('   - Event structure analysis:');
      console.log('     * Has source:', !!event?.source);
      console.log('     * Has detail-type:', !!event?.['detail-type']);
      console.log('     * Has detail:', !!event?.detail);
      console.log('     * Has httpMethod:', !!event?.httpMethod);
      console.log('     * Has path:', !!event?.path);
      console.log('   - Event keys:', event ? Object.keys(event) : 'N/A');
      console.log('   - Event type:', event ? typeof event : 'N/A');
      console.log('   - Event value:', JSON.stringify(event, null, 2));
      
      result = {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Unknown event type',
          received: { 
            source: event?.source, 
            detailType: event?.['detail-type'],
            httpMethod: event?.httpMethod, 
            path: event?.path 
          }
        })
      };
    }
    
    console.log('Handler result:', JSON.stringify(result, null, 2));
    console.log('=== CUSTOMER BRIDGE LAMBDA SUCCESS ===');
    
    return result;
    
  } catch (error) {
    console.error('=== CUSTOMER BRIDGE LAMBDA ERROR ===');
    console.error('Error in main handler:', error);
    console.error('Error stack:', error.stack);
    console.error('=== CUSTOMER BRIDGE LAMBDA ERROR END ===');
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(event)
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Handle HTTP API Gateway requests
 */
async function handleHttpRequest(event) {
  // Handle both API Gateway and Function URL events
  const httpMethod = event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method);
  const path = event.path || event.rawPath;
  
  console.log('HTTP Request Details:');
  console.log('  - Method:', httpMethod);
  console.log('  - Path:', path);
  console.log('  - Event type:', event.requestContext ? 'Function URL' : 'API Gateway');
  console.log('  - Full event structure:', JSON.stringify(event, null, 2));
  
  switch (httpMethod) {
    case 'OPTIONS':
      return await handleOptions(event);
      
    case 'POST':
      if (path === '/vendor-update') {
        return await handleVendorUpdate(event);
      } else {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(event)
          },
          body: JSON.stringify({ error: 'Route not found' })
        };
      }
      
    case 'GET':
      if (path === '/vendor-info') {
        return await handleGetVendorInfo(event);
      } else {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(event)
          },
          body: JSON.stringify({ error: 'Route not found' })
        };
      }
      
    default:
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(event)
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
  }
}

/**
 * Handle EventBridge vendor onboarding events
 */
async function handleEventBridgeVendorEvent(event) {
  try {
    console.log('=== EVENTBRIDGE EVENT PROCESSING START ===');
    console.log('Raw EventBridge event received:', JSON.stringify(event, null, 2));
    
    // Step 1: Validate EventBridge event structure
    console.log('Validating EventBridge event structure...');
    
    // Check if this is a valid EventBridge event
    if (!event || typeof event !== 'object') {
      console.error('❌ Invalid EventBridge event: event is not an object');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(event)
        },
        body: JSON.stringify({ 
          error: 'Invalid EventBridge event structure',
          received: event,
          expected: 'EventBridge event object with source, detail-type, and detail fields'
        })
      };
    }

    // Check if this is a vendor onboarding event
    if (event.source === 'vendor.onboarding' && event['detail-type'] === 'VendorRegistered') {
      console.log('🎯 Processing vendor onboarding event');
      
      const vendorData = event.detail;
      console.log('📋 Vendor data from event:', JSON.stringify(vendorData, null, 2));
      
      // Store vendor update
      const updateRecord = {
        email: vendorData.email.toLowerCase(),
        vendorId: vendorData.vendorId || `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        updateType: 'vendor_registered',
        timestamp: new Date().toISOString(),
        data: vendorData,
        status: 'received'
      };
      
      console.log('💾 Storing vendor update:', JSON.stringify(updateRecord, null, 2));
      
      await dynamodb.send(new PutCommand({
        TableName: VENDOR_UPDATES_TABLE,
        Item: updateRecord
      }));
      
      console.log('✅ Vendor update stored successfully');
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(event)
        },
        body: JSON.stringify({
          message: 'Vendor onboarding event processed successfully',
          vendorId: updateRecord.vendorId
        })
      };
    }
    
    // Unknown event type
    console.log('⚠️ Unknown EventBridge event type:', event['detail-type']);
          return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(event)
        },
        body: JSON.stringify({
          error: 'Unknown EventBridge event type',
          received: event['detail-type']
        })
      };
    
  } catch (error) {
    console.error('❌ Error processing EventBridge event:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(event)
      },
      body: JSON.stringify({
        error: 'Failed to process EventBridge event',
        message: error.message
      })
    };
  }
}

/**
 * Handle POST /vendor-update - Receives vendor updates from DirectSignup
 */
async function handleVendorUpdate(event) {
  try {
    console.log('=== VENDOR UPDATE HANDLER START ===');
    console.log('🔍 Raw event received:', JSON.stringify(event, null, 2));
    console.log('🔍 Event body type:', typeof event.body);
    console.log('🔍 Event body length:', event.body ? event.body.length : 'undefined');
    
    // Parse the request body
    let vendorData;
    try {
      vendorData = JSON.parse(event.body);
      console.log('✅ Successfully parsed vendor data:', JSON.stringify(vendorData, null, 2));
      console.log('🔍 Vendor data keys:', Object.keys(vendorData));
      console.log('🔍 Vendor ID:', vendorData.vendorId);
      console.log('🔍 Update type:', vendorData.updateType);
      console.log('🔍 Additional data:', vendorData.data);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      console.error('❌ Raw body content:', event.body);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    // Validate required fields
    console.log('🔍 Validating required fields...');
    if (!vendorData.email || !vendorData.updateType) {
      console.error('❌ Missing required fields:');
      console.error('   - email:', vendorData.email);
      console.error('   - updateType:', vendorData.updateType);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: email and updateType are required' 
        })
      };
    }
    console.log('✅ Required fields validation passed');
    
    // Create record with id as primary key (since that's the table structure)
    const updateRecord = {
      id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Primary key for table structure
      email: vendorData.email.toLowerCase(), // Store email for filtering
      vendorId: vendorData.vendorId || `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      updateType: vendorData.updateType,
      timestamp: vendorData.timestamp || new Date().toISOString(),
      data: vendorData.data || {},
      status: 'received'
    };
    
    console.log('🔍 Prepared update record:', JSON.stringify(updateRecord, null, 2));
    console.log('🔍 DynamoDB table name:', VENDOR_UPDATES_TABLE);
    
    // Save to DynamoDB
    console.log('💾 Saving to DynamoDB...');
    const dynamoParams = {
      TableName: VENDOR_UPDATES_TABLE,
      Item: updateRecord
    };
    console.log('🔍 DynamoDB params:', JSON.stringify(dynamoParams, null, 2));
    
    await dynamodb.send(new PutCommand(dynamoParams));
    
    console.log('✅ Vendor update saved successfully to DynamoDB');
    console.log('🔍 Saved record ID:', updateRecord.id);
    console.log('🔍 Saved timestamp:', updateRecord.timestamp);
    
    // Return success response
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(event)
      },
      body: JSON.stringify({
        message: 'Got it, thanks!',
        updateId: updateRecord.id,
        timestamp: updateRecord.timestamp
      })
    };
    
    console.log('🔍 Returning response:', JSON.stringify(response, null, 2));
    console.log('=== VENDOR UPDATE HANDLER SUCCESS ===');
    
    return response;
    
  } catch (error) {
    console.error('=== VENDOR UPDATE HANDLER ERROR ===');
    console.error('❌ Error handling vendor update:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('=== VENDOR UPDATE HANDLER ERROR END ===');
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(event)
      },
      body: JSON.stringify({
        error: 'Failed to process vendor update',
        message: error.message
      })
    };
  }
}

/**
 * Handle GET /vendor-info - Provides latest vendor info to Customer UI
 */
async function handleGetVendorInfo(event) {
  try {
    console.log('Handling get vendor info request');
    
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const vendorId = queryParams.vendorId;
    const email = queryParams.email;
    const limit = parseInt(queryParams.limit) || 10;
    
    console.log('Query parameters:', { vendorId, email, limit });
    
    let result;
    
    // Since the table uses 'id' as the primary key, we need to use ScanCommand
    // and filter by email in the data field
    console.log('🔍 Using ScanCommand with email filter (table has id as primary key)');
    let scanParams = {
      TableName: VENDOR_UPDATES_TABLE,
      Limit: Math.min(limit, 100), // Cap at 100 items
      ScanIndexForward: false // Get newest first
    };
    
    // Build filter expression based on parameters
    let filterExpressions = [];
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};
    
    // If vendorId is specified, filter by it
    if (vendorId) {
      filterExpressions.push('id = :vendorId');
      expressionAttributeValues[':vendorId'] = vendorId;
    }
    
    // If email is specified, filter by it (email is stored in both top-level and data field)
    if (email) {
      filterExpressions.push('(email = :email OR contains(#data.#email, :email))');
      expressionAttributeValues[':email'] = email.toLowerCase();
      expressionAttributeNames['#data'] = 'data';
      expressionAttributeNames['#email'] = 'email';
    }
    
    // Apply filters if any exist
    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
      if (Object.keys(expressionAttributeNames).length > 0) {
        scanParams.ExpressionAttributeNames = expressionAttributeNames;
      }
    }
    
    console.log('🔍 Scanning DynamoDB with params:', JSON.stringify(scanParams, null, 2));
    result = await dynamodb.send(new ScanCommand(scanParams));
    console.log(`🔍 Scan result: ${result.Items.length} items found`);
    
    console.log(`Found ${result.Items.length} vendor updates`);
    
    // Sort by timestamp (newest first) and limit results
    const sortedItems = result.Items
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    // Return vendor info
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(event)
      },
      body: JSON.stringify({
        message: 'Here is the latest vendor info!',
        totalUpdates: result.Items.length,
        returnedUpdates: sortedItems.length,
        updates: sortedItems
      })
    };
    
  } catch (error) {
    console.error('Error handling get vendor info:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(event)
      },
      body: JSON.stringify({
        error: 'Failed to retrieve vendor info',
        message: error.message
      })
    };
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
async function handleOptions(event) {
  return {
    statusCode: 200,
    headers: getCorsHeaders(event),
    body: ''
  };
}
