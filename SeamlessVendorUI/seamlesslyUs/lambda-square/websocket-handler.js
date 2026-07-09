// WebSocket Handler Lambda
// Manages WebSocket connections and broadcasts vendor events

const AWS = require('aws-sdk');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_ENDPOINT
});

// Environment variables
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'ezdrink-websocket-connections';
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

// WebSocket event types
const WEBSOCKET_EVENTS = {
  CONNECT: '$connect',
  DISCONNECT: '$disconnect',
  DEFAULT: '$default'
};

// Handle WebSocket connection
async function handleConnect(event) {
  const connectionId = event.requestContext.connectionId;
  const timestamp = Math.floor(Date.now() / 1000) + 3600; // TTL: 1 hour
  
  try {
    // Store connection in DynamoDB
    await dynamodb.put({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        ttl: timestamp,
        connectedAt: new Date().toISOString(),
        userAgent: event.requestContext.identity.userAgent || 'unknown'
      }
    }).promise();
    
    console.log(`✅ WebSocket connected: ${connectionId}`);
    
    return {
      statusCode: 200,
      body: 'Connected to EzDrink WebSocket'
    };
    
  } catch (error) {
    console.error('Error storing connection:', error);
    return {
      statusCode: 500,
      body: 'Failed to connect'
    };
  }
}

// Handle WebSocket disconnection
async function handleDisconnect(event) {
  const connectionId = event.requestContext.connectionId;
  
  try {
    // Remove connection from DynamoDB
    await dynamodb.delete({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId }
    }).promise();
    
    console.log(`✅ WebSocket disconnected: ${connectionId}`);
    
    return {
      statusCode: 200,
      body: 'Disconnected'
    };
    
  } catch (error) {
    console.error('Error removing connection:', error);
    return {
      statusCode: 500,
      body: 'Failed to disconnect'
    };
  }
}

// Broadcast message to all connected clients
async function broadcastToAll(message) {
  try {
    // Get all active connections
    const result = await dynamodb.scan({
      TableName: CONNECTIONS_TABLE,
      ProjectionExpression: 'connectionId'
    }).promise();
    
    const connections = result.Items;
    console.log(`📡 Broadcasting to ${connections.length} connections`);
    
    // Send message to each connection
    const sendPromises = connections.map(async (connection) => {
      try {
        await apigatewaymanagementapi.postToConnection({
          ConnectionId: connection.connectionId,
          Data: JSON.stringify(message)
        }).promise();
        
        return { connectionId: connection.connectionId, status: 'sent' };
      } catch (error) {
        if (error.statusCode === 410) {
          // Connection is stale, remove it
          console.log(`🧹 Removing stale connection: ${connection.connectionId}`);
          await dynamodb.delete({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId: connection.connectionId }
          }).promise();
          return { connectionId: connection.connectionId, status: 'removed' };
        }
        
        console.error(`Error sending to connection ${connection.connectionId}:`, error);
        return { connectionId: connection.connectionId, status: 'error', error: error.message };
      }
    });
    
    const results = await Promise.allSettled(sendPromises);
    
    // Log results
    const sent = results.filter(r => r.status === 'fulfilled' && r.value.status === 'sent').length;
    const removed = results.filter(r => r.status === 'fulfilled' && r.value.status === 'removed').length;
    const errors = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'error')).length;
    
    console.log(`📊 Broadcast results: ${sent} sent, ${removed} removed, ${errors} errors`);
    
    return {
      totalConnections: connections.length,
      sent,
      removed,
      errors
    };
    
  } catch (error) {
    console.error('Error broadcasting message:', error);
    throw error;
  }
}

// Handle vendor events (called from vendor management Lambda)
async function handleVendorEvent(event) {
  try {
    const { eventType, vendorData } = event;
    
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
    
    console.log(`📡 Broadcasting vendor event: ${eventType}`);
    const result = await broadcastToAll(message);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Vendor event broadcasted successfully',
        broadcastResult: result
      })
    };
    
  } catch (error) {
    console.error('Error handling vendor event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to broadcast vendor event',
        details: error.message
      })
    };
  }
}

// Main WebSocket handler
exports.handler = async (event) => {
  console.log('=== WEBSOCKET HANDLER ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const routeKey = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId;
  
  console.log(`Route: ${routeKey}, Connection: ${connectionId}`);
  
  try {
    switch (routeKey) {
      case WEBSOCKET_EVENTS.CONNECT:
        return await handleConnect(event);
        
      case WEBSOCKET_EVENTS.DISCONNECT:
        return await handleDisconnect(event);
        
      case WEBSOCKET_EVENTS.DEFAULT:
        // Handle custom messages (like vendor events)
        if (event.body) {
          const body = JSON.parse(event.body);
          if (body.type && body.type.startsWith('VENDOR_')) {
            return await handleVendorEvent(body);
          }
        }
        
        return {
          statusCode: 200,
          body: 'Message received'
        };
        
      default:
        console.log(`Unknown route: ${routeKey}`);
        return {
          statusCode: 400,
          body: 'Unknown route'
        };
    }
    
  } catch (error) {
    console.error('WebSocket handler error:', error);
    return {
      statusCode: 500,
      body: 'Internal server error'
    };
  }
};

// Export for use in other Lambda functions
module.exports = { broadcastToAll };
