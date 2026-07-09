const axios = require('axios');
const AWS = require('aws-sdk');

// Environment variables are set in Lambda configuration

// Initialize DynamoDB
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_CLOVER_TABLE || 'seamless-clover-tokens';

// Clover OAuth configuration
const CLOVER_OAUTH_CONFIG = {
  authorizeUrl: 'https://clover.com/oauth/authorize',
  tokenUrl: 'https://clover.com/oauth/token',
  scopes: ['payments.read', 'inventory.read', 'orders.read', 'merchants.read']
};

/**
 * Handle Clover OAuth callback - exchange authorization code for access token
 */
exports.handleCloverOAuthCallback = async (event) => {
  console.log('🟢 [CLOVER OAUTH] Processing OAuth callback');
  
  try {
    const body = JSON.parse(event.body || '{}');
    const { code, state, error } = body;
    
    if (error) {
      console.error('❌ [CLOVER OAUTH] OAuth error:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: `Clover OAuth error: ${error}`,
          error: error
        })
      };
    }
    
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Authorization code is required'
        })
      };
    }
    
    // Parse state to get integration data
    let integrationData;
    try {
      integrationData = JSON.parse(decodeURIComponent(state || '{}'));
    } catch (e) {
      console.error('❌ [CLOVER OAUTH] Failed to parse state:', e);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Invalid state parameter'
        })
      };
    }
    
    console.log('📋 [CLOVER OAUTH] Integration data:', {
      businessName: integrationData.businessName,
      email: integrationData.email,
      selectedPlan: integrationData.selectedPlan
    });
    
    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code, integrationData);
    
    if (!tokenResponse.success) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Failed to exchange code for token',
          error: tokenResponse.error
        })
      };
    }
    
    // Store token data in DynamoDB
    const storeResult = await storeCloverTokens(tokenResponse.data, integrationData);
    
    if (!storeResult.success) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Failed to store token data',
          error: storeResult.error
        })
      };
    }
    
    console.log('✅ [CLOVER OAUTH] Integration completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Clover integration completed successfully',
        businessName: integrationData.businessName,
        email: integrationData.email,
        merchantId: tokenResponse.data.merchant_id
      })
    };
    
  } catch (error) {
    console.error('❌ [CLOVER OAUTH] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};

/**
 * Exchange authorization code for access token using Clover OAuth 2.0
 */
async function exchangeCodeForToken(code, integrationData) {
  try {
    console.log('🔄 [CLOVER OAUTH] Exchanging code for token...');
    
    const tokenRequestData = {
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.CLOVER_CLIENT_ID,
      client_secret: process.env.CLOVER_CLIENT_SECRET,
      redirect_uri: process.env.CLOVER_REDIRECT_URI
    };
    
    console.log('📤 [CLOVER OAUTH] Token request data:', {
      grant_type: tokenRequestData.grant_type,
      client_id: tokenRequestData.client_id ? '***' : 'NOT_SET',
      redirect_uri: tokenRequestData.redirect_uri
    });
    
    const response = await axios.post(CLOVER_OAUTH_CONFIG.tokenUrl, tokenRequestData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('✅ [CLOVER OAUTH] Token exchange successful');
    
    const tokenData = response.data;
    
    // Clover returns access_token, refresh_token, expires_in, and merchant_id
    return {
      success: true,
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        merchant_id: tokenData.merchant_id,
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ [CLOVER OAUTH] Token exchange failed:', error);
    
    if (error.response) {
      console.error('❌ [CLOVER OAUTH] Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return {
      success: false,
      error: error.message || 'Token exchange failed'
    };
  }
}

/**
 * Store Clover OAuth tokens in DynamoDB
 */
async function storeCloverTokens(tokenData, integrationData) {
  try {
    console.log('💾 [CLOVER OAUTH] Storing tokens in DynamoDB...');
    
    const item = {
      token: integrationData.token, // This is our internal token, not Clover's
      email: integrationData.email,
      businessName: integrationData.businessName,
      selectedPlan: integrationData.selectedPlan,
      posSystem: 'clover',
      integrationStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Clover-specific data
      cloverAccessToken: tokenData.access_token,
      cloverRefreshToken: tokenData.refresh_token,
      cloverMerchantId: tokenData.merchant_id,
      cloverTokenExpiresAt: tokenData.expires_at,
      cloverScopes: tokenData.scope,
      
      // Metadata
      lastTokenRefresh: new Date().toISOString(),
      tokenRefreshCount: 0
    };
    
    const params = {
      TableName: TABLE_NAME,
      Item: item
    };
    
    await dynamodb.put(params).promise();
    
    console.log('✅ [CLOVER OAUTH] Tokens stored successfully');
    
    return {
      success: true,
      message: 'Tokens stored successfully'
    };
    
  } catch (error) {
    console.error('❌ [CLOVER OAUTH] Failed to store tokens:', error);
    return {
      success: false,
      error: error.message || 'Failed to store tokens'
    };
  }
}

/**
 * Refresh Clover access token using refresh token
 */
async function refreshCloverToken(refreshToken) {
  try {
    console.log('🔄 [CLOVER OAUTH] Refreshing access token...');
    
    const refreshRequestData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.CLOVER_CLIENT_ID,
      client_secret: process.env.CLOVER_CLIENT_SECRET
    };
    
    const response = await axios.post(CLOVER_OAUTH_CONFIG.tokenUrl, refreshRequestData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('✅ [CLOVER OAUTH] Token refresh successful');
    
    const tokenData = response.data;
    
    return {
      success: true,
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // Clover may not return new refresh token
        expires_in: tokenData.expires_in,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ [CLOVER OAUTH] Token refresh failed:', error);
    return {
      success: false,
      error: error.message || 'Token refresh failed'
    };
  }
}

/**
 * Get Clover merchant information
 */
async function getCloverMerchantInfo(accessToken, merchantId) {
  try {
    console.log('📊 [CLOVER OAUTH] Fetching merchant info...');
    
    const response = await axios.get(`https://api.clover.com/v3/merchants/${merchantId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ [CLOVER OAUTH] Merchant info retrieved');
    
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    console.error('❌ [CLOVER OAUTH] Failed to get merchant info:', error);
    return {
      success: false,
      error: error.message || 'Failed to get merchant info'
    };
  }
}

module.exports = {
  handleCloverOAuthCallback: exports.handleCloverOAuthCallback,
  refreshCloverToken,
  getCloverMerchantInfo
};
