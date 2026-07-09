// Lightspeed Integration Lambda Handler - Production Ready
// Handles OAuth flow and Lightspeed API integration with token refresh

const https = require('https');
const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS DynamoDB client
const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

// Environment variables for Lightspeed production
const LIGHTSPEED_CLIENT_ID = process.env.LIGHTSPEED_CLIENT_ID || 'lXLqYMFqq1Xr4T5OZG7a6xeheHFpYMR8';
const LIGHTSPEED_CLIENT_SECRET = process.env.LIGHTSPEED_CLIENT_SECRET || 'uBi21HKNCK9fyIGP1Bkk4T0ArxmsEvj8';
const LIGHTSPEED_ENVIRONMENT = process.env.LIGHTSPEED_ENVIRONMENT || 'production';
const DATABASE_URL = process.env.DATABASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-lightspeed-lambda-url.lambda-url.us-east-1.on.aws';
const VENDORS_TABLE = process.env.VENDORS_TABLE || 'ezdrink-vendors';
const VENDOR_UPDATES_TABLE = process.env.VENDOR_UPDATES_TABLE || 'vendor-updates-table';

// Token refresh configuration
const TOKEN_REFRESH_THRESHOLD_DAYS = 7; // Refresh tokens 7 days before expiry
const TOKEN_EXPIRY_DAYS = 30; // Lightspeed access tokens expire after 30 days

// Validate required environment variables
if (!LIGHTSPEED_CLIENT_ID) {
    console.error('LIGHTSPEED_CLIENT_ID not configured');
    throw new Error('Lightspeed Client ID not configured');
}

if (!LIGHTSPEED_CLIENT_SECRET) {
    console.error('LIGHTSPEED_CLIENT_SECRET not configured');
    throw new Error('Lightspeed Client Secret not configured');
}

// Log table configuration for debugging
console.log('🔧 DynamoDB Table Configuration:');
console.log('  - VENDORS_TABLE:', VENDORS_TABLE);
console.log('  - VENDOR_UPDATES_TABLE:', VENDOR_UPDATES_TABLE);
console.log('  - TOKEN_REFRESH_THRESHOLD_DAYS:', TOKEN_REFRESH_THRESHOLD_DAYS);
console.log('  - TOKEN_EXPIRY_DAYS:', TOKEN_EXPIRY_DAYS);

// In-memory storage for vendor data (in production, use DynamoDB)
const vendorSessions = new Map();

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

// CORS headers for production - allow both specific domain and Vercel deployments
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Will be overridden by getCorsOrigin function
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

/**
 * Refresh Lightspeed access token using refresh token
 * @param {string} refreshToken - Lightspeed refresh token
 * @returns {Object} New access and refresh tokens
 */
async function refreshLightspeedToken(refreshToken) {
    try {
        console.log('🔄 Refreshing Lightspeed access token...');
        
        const tokenUrl = 'https://cloud.lightspeedapp.com/oauth/access_token.php';
        const postData = JSON.stringify({
            client_id: LIGHTSPEED_CLIENT_ID,
            client_secret: LIGHTSPEED_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });
        
        const options = {
            hostname: 'cloud.lightspeedapp.com',
            port: 443,
            path: '/oauth/access_token.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const response = await makeRequest(options, postData);
        
        if (response.status !== 200) {
            throw new Error(`Token refresh failed with status ${response.status}: ${JSON.stringify(response.data)}`);
        }
        
        const { access_token, refresh_token, expires_in } = response.data;
        
        if (!access_token || !refresh_token) {
            throw new Error('Invalid response from Lightspeed token refresh');
        }
        
        console.log('✅ Lightspeed access token refreshed successfully');
        console.log(`   - New access token: ${access_token.substring(0, 10)}...`);
        console.log(`   - New refresh token: ${refresh_token.substring(0, 10)}...`);
        console.log(`   - Expires in: ${expires_in || 'Not specified'} seconds`);
        
        return {
            access_token,
            refresh_token,
            expires_in,
            refreshed_at: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Failed to refresh Lightspeed access token:', error);
        throw error;
    }
}

/**
 * Make HTTPS request with Promise
 * @param {Object} options - HTTPS options
 * @param {string} postData - POST data (optional)
 * @returns {Promise<Object>} Response object with status and data
 */
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (parseError) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

/**
 * Generate random state parameter for OAuth security
 * @returns {string} Random state string
 */
function generateState() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Save vendor data to DynamoDB
 * @param {string} customerId - Customer ID from signup
 * @param {string} merchantId - Lightspeed merchant ID
 * @param {string} accessToken - Lightspeed access token
 * @param {string} refreshToken - Lightspeed refresh token
 * @param {string} email - Vendor email
 * @param {string} businessName - Business name
 */
async function saveVendorToDynamoDB(customerId, merchantId, accessToken, refreshToken, email, businessName) {
    try {
        console.log('💾 Saving vendor data to DynamoDB...');
        
        const vendorData = {
            customer_id: customerId,
            merchantId: merchantId,
            posSystem: 'lightspeed',
            accessToken: accessToken,
            refreshToken: refreshToken,
            email: email,
            businessName: businessName,
            status: 'active',
            connectedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            tokenExpiry: new Date(Date.now() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString()
        };
        
        const putCommand = new PutCommand({
            TableName: VENDORS_TABLE,
            Item: vendorData
        });
        
        await dynamodb.send(putCommand);
        console.log('✅ Vendor data saved to DynamoDB successfully');
        
    } catch (error) {
        console.error('❌ Failed to save vendor data to DynamoDB:', error);
        throw error;
    }
}

/**
 * Update vendor record in vendor-updates-table with Lightspeed connection data
 * @param {string} customerId - Customer ID
 * @param {string} merchantId - Lightspeed merchant ID
 * @param {string} accessToken - Lightspeed access token
 * @param {string} refreshToken - Lightspeed refresh token
 * @param {string} email - Vendor email
 */
async function updateVendorRecordWithLightspeedData(customerId, merchantId, accessToken, refreshToken, email) {
    try {
        console.log('🔄 Updating vendor record in vendor-updates-table...');
        
        const updateCommand = new UpdateCommand({
            TableName: VENDOR_UPDATES_TABLE,
            Key: { customer_id: customerId },
            UpdateExpression: 'SET posSystem = :posSystem, merchantId = :merchantId, accessToken = :accessToken, refreshToken = :refreshToken, lastUpdated = :lastUpdated, status = :status',
            ExpressionAttributeValues: {
                ':posSystem': 'lightspeed',
                ':merchantId': merchantId,
                ':accessToken': accessToken,
                ':refreshToken': refreshToken,
                ':lastUpdated': new Date().toISOString(),
                ':status': 'connected'
            }
        });
        
        await dynamodb.send(updateCommand);
        console.log('✅ Vendor record updated in vendor-updates-table successfully');
        
    } catch (error) {
        console.error('❌ Failed to update vendor record in vendor-updates-table:', error);
        throw error;
    }
}

/**
 * Get Lightspeed merchant information
 * @param {string} accessToken - Lightspeed access token
 * @returns {Object} Merchant information
 */
async function getLightspeedMerchantInfo(accessToken) {
    try {
        console.log('🔍 Getting Lightspeed merchant information...');
        
        const options = {
            hostname: 'cloud.lightspeedapp.com',
            port: 443,
            path: '/api/Account.json',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        const response = await makeRequest(options);
        
        if (response.status !== 200) {
            throw new Error(`Failed to get merchant info: ${response.status}`);
        }
        
        console.log('✅ Lightspeed merchant information retrieved successfully');
        return response.data;
        
    } catch (error) {
        console.error('❌ Failed to get Lightspeed merchant information:', error);
        throw error;
    }
}

/**
 * Main Lambda handler
 * @param {Object} event - Lambda event
 * @param {Object} context - Lambda context
 * @returns {Object} Lambda response
 */
exports.handler = async (event, context) => {
    console.log('🚀 Lightspeed Lambda Handler Started');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        const { httpMethod, rawPath, queryStringParameters, body } = event;
        
        // Handle CORS preflight
        if (httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': getCorsOrigin(event),
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400'
                },
                body: ''
            };
        }
        
        // Route handling
        if (rawPath === '/start-oauth') {
            return await handleStartOAuth(queryStringParameters);
        } else if (rawPath === '/oauth-callback') {
            return await handleOAuthCallback(queryStringParameters);
        } else if (rawPath === '/test-connection') {
            return await handleTestConnection(queryStringParameters);
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': getCorsOrigin(event),
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400'
                },
                body: JSON.stringify({ error: 'Endpoint not found' })
            };
        }
        
    } catch (error) {
        console.error('❌ Lambda handler error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': getCorsOrigin(event),
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

/**
 * Handle OAuth start request
 * @param {Object} queryParams - Query parameters
 * @returns {Object} Lambda response with OAuth URL
 */
async function handleStartOAuth(queryParams) {
    try {
        console.log('🔗 Starting Lightspeed OAuth flow...');
        
        const { email, business, customer_id } = queryParams;
        
        if (!email || !business || !customer_id) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Missing required parameters: email, business, customer_id' 
                })
            };
        }
        
        // Store vendor session data
        const sessionId = generateState();
        vendorSessions.set(sessionId, {
            email,
            business,
            customer_id,
            timestamp: Date.now()
        });
        
        // Generate OAuth URL for Lightspeed
        const oauthUrl = `https://cloud.lightspeedapp.com/oauth/authorize.php?client_id=${LIGHTSPEED_CLIENT_ID}&response_type=code&scope=employee:all&state=${sessionId}`;
        
        console.log('✅ Lightspeed OAuth URL generated successfully');
        console.log(`   - OAuth URL: ${oauthUrl}`);
        console.log(`   - Session ID: ${sessionId}`);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                authUrl: oauthUrl,
                sessionId: sessionId
            })
        };
        
    } catch (error) {
        console.error('❌ Failed to start OAuth:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Failed to start OAuth flow',
                message: error.message 
            })
        };
    }
}

/**
 * Handle OAuth callback
 * @param {Object} queryParams - Query parameters
 * @returns {Object} Lambda response
 */
async function handleOAuthCallback(queryParams) {
    try {
        console.log('🔄 Handling Lightspeed OAuth callback...');
        
        const { code, state, error: oauthError } = queryParams;
        
        if (oauthError) {
            console.error('❌ OAuth error:', oauthError);
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'OAuth authorization failed',
                    message: oauthError 
                })
            };
        }
        
        if (!code || !state) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Missing authorization code or state parameter' 
                })
            };
        }
        
        // Retrieve vendor session data
        const vendorSession = vendorSessions.get(state);
        if (!vendorSession) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Invalid or expired session' 
                })
            };
        }
        
        const { email, business, customer_id } = vendorSession;
        
        console.log('📧 Vendor session data retrieved:');
        console.log(`   - Email: ${email}`);
        console.log(`   - Business: ${business}`);
        console.log(`   - Customer ID: ${customer_id}`);
        
        // Exchange authorization code for access token
        console.log('🔄 Exchanging authorization code for access token...');
        
        const tokenUrl = 'https://cloud.lightspeedapp.com/oauth/access_token.php';
        const postData = JSON.stringify({
            client_id: LIGHTSPEED_CLIENT_ID,
            client_secret: LIGHTSPEED_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code
        });
        
        const options = {
            hostname: 'cloud.lightspeedapp.com',
            port: 443,
            path: '/oauth/access_token.php',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const tokenResponse = await makeRequest(options, postData);
        
        if (tokenResponse.status !== 200) {
            throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }
        
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        
        if (!access_token || !refresh_token) {
            throw new Error('Invalid token response from Lightspeed');
        }
        
        console.log('✅ Access token received from Lightspeed');
        console.log(`   - Access token: ${access_token.substring(0, 10)}...`);
        console.log(`   - Refresh token: ${refresh_token.substring(0, 10)}...`);
        console.log(`   - Expires in: ${expires_in} seconds`);
        
        // Get merchant information
        const merchantInfo = await getLightspeedMerchantInfo(access_token);
        const merchant_id = merchantInfo.Account?.accountID || `ls_${Date.now()}`;
        
        console.log('🏢 Merchant information retrieved:');
        console.log(`   - Merchant ID: ${merchant_id}`);
        console.log(`   - Account: ${merchantInfo.Account?.name || 'N/A'}`);
        
        // Save vendor data to DynamoDB with both customer_id and merchantId
        if (customer_id && merchant_id) {
            try {
                console.log('💾 Saving vendor data to DynamoDB...');
                await saveVendorToDynamoDB(
                    customer_id,    // customer_id from signup
                    merchant_id,    // merchantId from Lightspeed
                    access_token,   // Lightspeed access token
                    refresh_token,  // Lightspeed refresh token
                    email,          // email from session
                    business        // business from session
                );
                console.log('✅ Vendor data successfully linked in DynamoDB');
                
                // Update vendor record in vendor-updates-table with Lightspeed connection data
                try {
                    console.log('🔄 Updating vendor record in vendor-updates-table...');
                    await updateVendorRecordWithLightspeedData(
                        customer_id,
                        merchant_id,
                        access_token,
                        refresh_token,
                        email
                    );
                    console.log('✅ Vendor record updated in vendor-updates-table');
                } catch (updateError) {
                    console.error('❌ Failed to update vendor record in vendor-updates-table:', updateError);
                    // Continue with the flow even if update fails
                }
                
            } catch (dbError) {
                console.error('❌ Failed to save vendor data to DynamoDB:', dbError);
                throw dbError;
            }
        }
        
        // Clean up session
        vendorSessions.delete(state);
        
        // Redirect to success page
        const successUrl = `${FRONTEND_URL}/lightspeed-success?merchant_id=${merchant_id}&business=${encodeURIComponent(business)}&email=${encodeURIComponent(email)}`;
        
        console.log('✅ OAuth callback completed successfully');
        console.log(`   - Redirecting to: ${successUrl}`);
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                redirectUrl: successUrl,
                merchant_id,
                business,
                email
            })
        };
        
    } catch (error) {
        console.error('❌ OAuth callback failed:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'OAuth callback failed',
                message: error.message 
            })
        };
    }
}

/**
 * Handle connection test request
 * @param {Object} queryParams - Query parameters
 * @returns {Object} Lambda response
 */
async function handleTestConnection(queryParams) {
    try {
        console.log('🧪 Testing Lightspeed connection...');
        
        const { merchant_id, access_token } = queryParams;
        
        if (!merchant_id || !access_token) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Missing merchant_id or access_token' 
                })
            };
        }
        
        // Test API connection by getting merchant info
        const merchantInfo = await getLightspeedMerchantInfo(access_token);
        
        console.log('✅ Lightspeed connection test successful');
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                message: 'Connection test successful',
                merchantInfo: merchantInfo
            })
        };
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Connection test failed',
                message: error.message 
            })
        };
    }
}
