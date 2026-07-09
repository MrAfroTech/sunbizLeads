const AWS = require('aws-sdk');

// Initialize DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Common OAuth utilities for POS integrations
 */

/**
 * Generate a secure random token for internal tracking
 */
function generateSecureToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate OAuth state parameter
 */
function validateOAuthState(state) {
  try {
    if (!state) return { valid: false, error: 'State parameter is required' };
    
    const decodedState = decodeURIComponent(state);
    const parsedState = JSON.parse(decodedState);
    
    // Check required fields
    if (!parsedState.token || !parsedState.email || !parsedState.businessName) {
      return { 
        valid: false, 
        error: 'State parameter missing required fields' 
      };
    }
    
    return { valid: true, data: parsedState };
    
  } catch (error) {
    return { 
      valid: false, 
      error: `Invalid state parameter: ${error.message}` 
    };
  }
}

/**
 * Store integration data in DynamoDB
 */
async function storeIntegrationData(tableName, item) {
  try {
    const params = {
      TableName: tableName,
      Item: item
    };
    
    await dynamodb.put(params).promise();
    
    return {
      success: true,
      message: 'Integration data stored successfully'
    };
    
  } catch (error) {
    console.error(`❌ Failed to store integration data in ${tableName}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to store integration data'
    };
  }
}

/**
 * Get integration data by token
 */
async function getIntegrationData(tableName, token) {
  try {
    const params = {
      TableName: tableName,
      Key: { token: token }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      return {
        success: false,
        error: 'Integration not found'
      };
    }
    
    return {
      success: true,
      data: result.Item
    };
    
  } catch (error) {
    console.error(`❌ Failed to get integration data from ${tableName}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to get integration data'
    };
  }
}

/**
 * Update integration status
 */
async function updateIntegrationStatus(tableName, token, status, additionalData = {}) {
  try {
    const updateExpression = 'SET integrationStatus = :status, updatedAt = :updatedAt';
    const expressionAttributeValues = {
      ':status': status,
      ':updatedAt': new Date().toISOString()
    };
    
    // Add additional fields to update
    Object.keys(additionalData).forEach(key => {
      const attrName = `:${key}`;
      updateExpression += `, ${key} = ${attrName}`;
      expressionAttributeValues[attrName] = additionalData[key];
    });
    
    const params = {
      TableName: tableName,
      Key: { token: token },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    await dynamodb.update(params).promise();
    
    return {
      success: true,
      message: 'Integration status updated successfully'
    };
    
  } catch (error) {
    console.error(`❌ Failed to update integration status in ${tableName}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to update integration status'
    };
  }
}

/**
 * Check if integration exists and is active
 */
async function isIntegrationActive(tableName, token) {
  try {
    const result = await getIntegrationData(tableName, token);
    
    if (!result.success) {
      return false;
    }
    
    return result.data.integrationStatus === 'active';
    
  } catch (error) {
    console.error(`❌ Failed to check integration status in ${tableName}:`, error);
    return false;
  }
}

/**
 * Log OAuth event for debugging
 */
function logOAuthEvent(event, posSystem, action) {
  console.log(`🔍 [${posSystem.toUpperCase()} OAUTH] ${action}:`, {
    timestamp: new Date().toISOString(),
    action: action,
    posSystem: posSystem,
    hasCode: !!event.body?.code,
    hasState: !!event.body?.state,
    hasError: !!event.body?.error
  });
}

/**
 * Create standardized error response
 */
function createErrorResponse(statusCode, message, error = null) {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify({
      success: false,
      message: message
    })
  };
  
  if (error) {
    response.body = JSON.stringify({
      success: false,
      message: message,
      error: error.message || error
    });
  }
  
  return response;
}

/**
 * Create standardized success response
 */
function createSuccessResponse(data = {}, message = 'Operation completed successfully') {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: message,
      data: data
    })
  };
}

/**
 * Validate required environment variables
 */
function validateRequiredEnvVars(requiredVars) {
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    return {
      valid: false,
      missing: missing,
      error: `Missing required environment variables: ${missing.join(', ')}`
    };
  }
  
  return { valid: true };
}

module.exports = {
  generateSecureToken,
  validateOAuthState,
  storeIntegrationData,
  getIntegrationData,
  updateIntegrationStatus,
  isIntegrationActive,
  logOAuthEvent,
  createErrorResponse,
  createSuccessResponse,
  validateRequiredEnvVars
};
