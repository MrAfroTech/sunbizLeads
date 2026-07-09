// Square Integration Lambda Handler - Production Ready
// Handles OAuth flow and Square API integration with token refresh

const https = require('https');
const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS DynamoDB client
const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

// Environment variables for Square production
const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID;
const SQUARE_APPLICATION_SECRET = process.env.SQUARE_APPLICATION_SECRET;
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production';
const DATABASE_URL = process.env.DATABASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://4kpajzuyfjzteslcq3sai5us6y0wqzqs.lambda-url.us-east-1.on.aws';
const VENDORS_TABLE = process.env.VENDORS_TABLE || 'ezdrink-vendors';
const VENDOR_UPDATES_TABLE = process.env.VENDOR_UPDATES_TABLE || 'vendor-updates-table';

// Token refresh configuration
const TOKEN_REFRESH_THRESHOLD_DAYS = 7; // Refresh tokens 7 days before expiry
const TOKEN_EXPIRY_DAYS = 30; // Square access tokens expire after 30 days

// Validate required environment variables
if (!SQUARE_APPLICATION_ID) {
    console.error('SQUARE_APPLICATION_ID not configured');
    throw new Error('Square Application ID not configured');
}

if (!SQUARE_APPLICATION_SECRET) {
    console.error('SQUARE_APPLICATION_SECRET not configured');
    throw new Error('Square Application Secret not configured');
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
 * Refresh Square access token using refresh token
 * @param {string} refreshToken - Square refresh token
 * @returns {Object} New access and refresh tokens
 */
async function refreshSquareToken(refreshToken) {
    try {
        console.log('🔄 Refreshing Square access token...');
        
        const tokenUrl = 'https://connect.squareup.com/oauth2/token';
        const postData = JSON.stringify({
            client_id: SQUARE_APPLICATION_ID,
            client_secret: SQUARE_APPLICATION_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });
        
        const options = {
            hostname: 'connect.squareup.com',
            port: 443,
            path: '/oauth2/token',
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
        
        const { access_token, refresh_token, expires_at } = response.data;
        
        if (!access_token || !refresh_token) {
            throw new Error('Invalid response from Square token refresh');
        }
        
        console.log('✅ Square access token refreshed successfully');
        console.log(`   - New access token: ${access_token.substring(0, 10)}...`);
        console.log(`   - New refresh token: ${refresh_token.substring(0, 10)}...`);
        console.log(`   - Expires at: ${expires_at || 'Not specified'}`);
        
        return {
            access_token,
            refresh_token,
            expires_at,
            refreshed_at: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Failed to refresh Square access token:', error.message);
        throw error;
    }
}

/**
 * Check if token needs refresh based on creation date
 * @param {string} tokenCreatedAt - ISO timestamp when token was created
 * @returns {Object} Token status and refresh recommendation
 */
function checkTokenRefreshStatus(tokenCreatedAt) {
    try {
        if (!tokenCreatedAt) {
            return {
                needsRefresh: true,
                reason: 'No creation timestamp found',
                daysSinceCreation: null,
                daysUntilExpiry: null
            };
        }
        
        const createdAt = new Date(tokenCreatedAt);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        const daysUntilExpiry = TOKEN_EXPIRY_DAYS - daysSinceCreation;
        
        const needsRefresh = daysUntilExpiry <= TOKEN_REFRESH_THRESHOLD_DAYS;
        
        return {
            needsRefresh,
            reason: needsRefresh ? 
                `Token expires in ${daysUntilExpiry} days (threshold: ${TOKEN_REFRESH_THRESHOLD_DAYS} days)` :
                `Token is still valid for ${daysUntilExpiry} days`,
            daysSinceCreation,
            daysUntilExpiry,
            createdAt: tokenCreatedAt,
            expiresAt: new Date(createdAt.getTime() + (TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString()
        };
        
    } catch (error) {
        console.error('❌ Error checking token refresh status:', error.message);
        return {
            needsRefresh: true,
            reason: 'Error parsing token creation date',
            daysSinceCreation: null,
            daysUntilExpiry: null
        };
    }
}

/**
 * Automatically refresh token if needed and update DynamoDB
 * @param {string} email - Vendor email
 * @param {string} currentAccessToken - Current access token
 * @param {string} currentRefreshToken - Current refresh token
 * @returns {Object} Token refresh result
 */
async function autoRefreshTokenIfNeeded(email, currentAccessToken, currentRefreshToken) {
    try {
        console.log(`🔄 Checking if token refresh is needed for ${email}...`);
        
        // First, get the vendor record to check token creation date
        const vendorRecord = await queryVendorByEmail(email);
        if (!vendorRecord) {
            throw new Error(`No vendor record found for email: ${email}`);
        }
        
        // Check token age and refresh status
        const tokenStatus = checkTokenRefreshStatus(vendorRecord.squareConnectedAt || vendorRecord.createdAt);
        console.log('📊 Token status:', tokenStatus);
        
        if (!tokenStatus.needsRefresh) {
            console.log('✅ Token is still valid, no refresh needed');
            return {
                refreshed: false,
                reason: tokenStatus.reason,
                accessToken: currentAccessToken,
                refreshToken: currentRefreshToken,
                tokenStatus
            };
        }
        
        console.log('🔄 Token needs refresh, proceeding with automatic refresh...');
        
        // Attempt to refresh the token
        const refreshResult = await refreshSquareToken(currentRefreshToken);
        
        // Update the vendor record with new tokens
        await updateVendorTokens(email, refreshResult.access_token, refreshResult.refresh_token);
        
        console.log('✅ Token automatically refreshed and updated in database');
        
        return {
            refreshed: true,
            reason: 'Token automatically refreshed',
            accessToken: refreshResult.access_token,
            refreshToken: refreshResult.refresh_token,
            tokenStatus,
            refreshResult
        };
        
    } catch (error) {
        console.error('❌ Automatic token refresh failed:', error.message);
        
        // Return the original tokens if refresh fails
        return {
            refreshed: false,
            reason: `Token refresh failed: ${error.message}`,
            accessToken: currentAccessToken,
            refreshToken: currentRefreshToken,
            error: error.message
        };
    }
}

/**
 * Update vendor tokens in DynamoDB
 * @param {string} email - Vendor email
 * @param {string} newAccessToken - New access token
 * @param {string} newRefreshToken - New refresh token
 */
async function updateVendorTokens(email, newAccessToken, newRefreshToken) {
    try {
        console.log(`💾 Updating tokens for vendor: ${email}`);
        
        const vendorRecord = await queryVendorByEmail(email);
        if (!vendorRecord) {
            throw new Error(`No vendor record found for email: ${email}`);
        }
        
        const recordId = vendorRecord.id?.S || vendorRecord.id;
        const updateParams = {
            TableName: VENDOR_UPDATES_TABLE,
            Key: { id: recordId },
            UpdateExpression: 'SET squareAccessToken = :accessToken, squareRefreshToken = :refreshToken, lastTokenRefresh = :refreshTime, #data.squareAccessToken = :accessToken, #data.squareRefreshToken = :refreshToken',
            ExpressionAttributeNames: {
                '#data': 'data'
            },
            ExpressionAttributeValues: {
                ':accessToken': newAccessToken,
                ':refreshToken': newRefreshToken,
                ':refreshTime': new Date().toISOString()
            }
        };
        
        await dynamodb.send(new UpdateCommand(updateParams));
        console.log('✅ Vendor tokens updated successfully in DynamoDB');
        
    } catch (error) {
        console.error('❌ Failed to update vendor tokens:', error.message);
        throw error;
    }
}

/**
 * Get valid access token for vendor (with automatic refresh if needed)
 * @param {string} email - Vendor email
 * @returns {Object} Valid access token and metadata
 */
async function getValidAccessToken(email) {
    try {
        console.log(`🔑 Getting valid access token for vendor: ${email}`);
        
        const vendorRecord = await queryVendorByEmail(email);
        if (!vendorRecord) {
            throw new Error(`No vendor record found for email: ${email}`);
        }
        
        const accessToken = vendorRecord.squareAccessToken || vendorRecord.data?.squareAccessToken;
        const refreshToken = vendorRecord.squareRefreshToken || vendorRecord.data?.squareRefreshToken;
        
        if (!accessToken || !refreshToken) {
            throw new Error('No Square tokens found for vendor');
        }
        
        // Check if token needs refresh and refresh if necessary
        const refreshResult = await autoRefreshTokenIfNeeded(email, accessToken, refreshToken);
        
        return {
            accessToken: refreshResult.accessToken,
            refreshToken: refreshResult.refreshToken,
            refreshed: refreshResult.refreshed,
            reason: refreshResult.reason,
            tokenStatus: refreshResult.tokenStatus
        };
        
    } catch (error) {
        console.error('❌ Failed to get valid access token:', error.message);
        throw error;
    }
}

/**
 * Handle manual token refresh endpoint
 * @param {Object} event - Lambda event
 * @returns {Object} Refresh result
 */
async function handleManualTokenRefresh(event) {
    try {
        const queryParams = new URLSearchParams(event.queryStringParameters || {});
        const email = queryParams.get('email');
        
        if (!email) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Email parameter is required' })
            };
        }
        
        console.log(`🔄 Manual token refresh requested for: ${email}`);
        
        // Get current tokens from DynamoDB
        const vendorRecord = await queryVendorByEmail(email);
        if (!vendorRecord) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Vendor not found' })
            };
        }
        
        const currentAccessToken = vendorRecord.squareAccessToken || vendorRecord.data?.squareAccessToken;
        const currentRefreshToken = vendorRecord.squareRefreshToken || vendorRecord.data?.squareRefreshToken;
        
        if (!currentAccessToken || !currentRefreshToken) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No Square tokens found for vendor' })
            };
        }
        
        // Refresh the token
        const refreshResult = await refreshSquareToken(currentRefreshToken);
        
        // Update DynamoDB with new tokens
        const recordId = vendorRecord.id?.S || vendorRecord.id;
        const updateParams = {
            TableName: VENDOR_UPDATES_TABLE,
            Key: { id: recordId },
            UpdateExpression: 'SET squareAccessToken = :accessToken, squareRefreshToken = :refreshToken, lastTokenRefresh = :refreshTime, #data.squareAccessToken = :accessToken, #data.squareRefreshToken = :refreshToken',
            ExpressionAttributeNames: {
                '#data': 'data'
            },
            ExpressionAttributeValues: {
                ':accessToken': refreshResult.access_token,
                ':refreshToken': refreshResult.refresh_token,
                ':refreshTime': refreshResult.refreshed_at
            }
        };
        
        await dynamodb.send(new UpdateCommand(updateParams));
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                message: 'Token refreshed successfully',
                vendor: email,
                refreshed_at: refreshResult.refreshed_at,
                new_access_token: refreshResult.access_token.substring(0, 10) + '...',
                new_refresh_token: refreshResult.refresh_token.substring(0, 10) + '...'
            })
        };
        
    } catch (error) {
        console.error('❌ Manual token refresh failed:', error.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Token refresh failed',
                message: error.message
            })
        };
    }
}

// Helper function to make HTTPS requests
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

// Generate secure state parameter for OAuth
function generateState() {
    return crypto.randomBytes(32).toString('hex');
}

// Query vendor-updates-table by email using the email-index GSI
async function queryVendorByEmail(email) {
    try {
        console.log('🔍 Querying vendor-updates-table for email using email-index GSI:', email);
        
        // Use Query with the email-index GSI since email is not the primary key
        const queryParams = {
            TableName: VENDOR_UPDATES_TABLE,
            IndexName: 'email-index', // Use the GSI we created
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email.toLowerCase()
            }
        };
        
        const result = await dynamodb.send(new QueryCommand(queryParams));
        console.log('🔍 DynamoDB query result:', result);
        
        if (!result.Items || result.Items.length === 0) {
            console.log('❌ No vendor record found for email:', email);
            return null;
        }
        
        // Get the first record (should be unique by email)
        const vendorRecord = result.Items[0];
        
        // Check if this is a vendor_registered record
        // Handle DynamoDB format where updateType is stored as {"S": "vendor_registered"}
        const updateType = vendorRecord.updateType?.S || vendorRecord.updateType;
        if (updateType !== 'vendor_registered') {
            console.log('❌ Record found but not a vendor_registered record:', updateType);
            return null;
        }
        
        console.log('✅ Found vendor record:', vendorRecord);
        return vendorRecord;
        
    } catch (error) {
        console.error('❌ Error querying vendor by email:', error);
        throw error;
    }
}

// Update vendor record in vendor-updates-table with Square connection data
async function updateVendorRecordWithSquareData(vendorId, merchantId, accessToken, refreshToken, email) {
    try {
        console.log('🔄 Updating vendor record with Square data:', { vendorId, merchantId, email });
        
        // First, query to get the record ID using the email-index GSI
        const vendorRecord = await queryVendorByEmail(email);
        if (!vendorRecord) {
            throw new Error(`No vendor record found for email: ${email}`);
        }
        
        // Update the existing vendor record with Square connection data
        // Use the record's ID as the primary key
        // Handle DynamoDB format where id is stored as {"S": "actual_id"}
        const recordId = vendorRecord.id?.S || vendorRecord.id;
        const updateParams = {
            TableName: VENDOR_UPDATES_TABLE,
            Key: {
                id: recordId // Use the ID from the queried record
            },
            UpdateExpression: 'SET #data.merchantId = :merchantId, #data.oauth_token = :oauthToken, #data.pos_type = :posType, #data.pos_connected = :posConnected, #data.square_connected_at = :connectedAt, #data.vendorId = :vendorId',
            ExpressionAttributeNames: {
                '#data': 'data'
            },
            ExpressionAttributeValues: {
                ':merchantId': merchantId,
                ':oauthToken': accessToken,
                ':posType': 'square',
                ':posConnected': true,
                ':connectedAt': new Date().toISOString(),
                ':vendorId': vendorId
            }
        };
        
        await dynamodb.send(new UpdateCommand(updateParams));
        console.log('✅ Vendor record updated successfully with Square data');
        
    } catch (error) {
        console.error('❌ Error updating vendor record with Square data:', error);
        throw error;
    }
}

// Save vendor data to DynamoDB with both customer_id and merchantId
async function saveVendorToDynamoDB(customer_id, merchantId, accessToken, refreshToken, email, business) {
    try {
        const timestamp = new Date().toISOString();
        
        const vendorData = {
            id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID for primary key
            customer_id: customer_id,           // Primary key from signup
            merchantId: merchantId,             // Square merchant ID
            email: email,
            businessName: business,
            squareConnected: true,
            squareConnectedAt: timestamp,
            createdAt: timestamp,               // When the record was first created
            lastUpdated: timestamp,            // When it was last updated
            posSystem: 'square',
            // Store Square tokens securely
            squareAccessToken: accessToken,
            squareRefreshToken: refreshToken
        };
        
        console.log('💾 Saving vendor data to DynamoDB:', JSON.stringify(vendorData, null, 2));
        
        await dynamodb.send(new PutCommand({
            TableName: VENDOR_UPDATES_TABLE,  // Fixed: Use the correct table that exists
            Item: vendorData
        }));
        
        console.log('✅ Vendor data saved successfully to DynamoDB');
        return vendorData;
        
    } catch (error) {
        console.error('❌ Error saving vendor data to DynamoDB:', error);
        throw error;
    }
}

// Start OAuth flow
async function handleStartOAuth(event) {
    try {
        const queryParams = new URLSearchParams(event.queryStringParameters || {});
        const email = queryParams.get('email');
        const business = queryParams.get('business');
        const customer_id = queryParams.get('customer_id');
        
        if (!email) {
                    return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Email parameter is required' })
        };
        }
        
        // Query vendor-updates-table by email to get customer record if customer_id not provided
        let vendorRecord = null;
        if (!customer_id) {
            try {
                console.log('🔍 Querying vendor-updates-table by email:', email);
                vendorRecord = await queryVendorByEmail(email);
                
                if (!vendorRecord) {
                    return {
                        statusCode: 404,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ error: 'No vendor registration found for this email address. Please complete registration first.' })
                    };
                }
                
                console.log('✅ Found vendor record:', vendorRecord);
                // Use the vendorId from the record
                customer_id = vendorRecord.vendorId;
                business = vendorRecord.data?.businessName || business;
                
            } catch (error) {
                console.error('❌ Error querying vendor by email:', error);
                return {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ error: 'Failed to look up vendor registration. Please try again.' })
                };
            }
        }

        // Generate secure session ID and state parameter
        const sessionId = generateState();
        const state = generateState();
        
        // Store vendor data in session
        vendorSessions.set(sessionId, {
            email: email,
            business: business,
            customer_id: customer_id,
            createdAt: Date.now(),
            state: state
        });
        
        // Clean up old sessions (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [id, session] of vendorSessions.entries()) {
            if (session.createdAt < oneHourAgo) {
                vendorSessions.delete(id);
            }
        }
        
        // Build Square authorization URL for production
        const authEndpoint = 'https://connect.squareup.com/oauth2/authorize';
        const redirectUri = `${FRONTEND_URL}/square-oauth-callback`;
        const scopes = 'MERCHANT_PROFILE_READ PAYMENTS_READ ORDERS_READ ORDERS_WRITE';
        
        // Use session ID as state parameter (Square will return this unchanged)
        const authState = sessionId;
        
        // DEBUGGING: Log all the values being used
        console.log('🔍 DEBUG: OAuth Configuration Values');
        console.log('  - FRONTEND_URL:', FRONTEND_URL);
        console.log('  - SQUARE_APPLICATION_ID:', SQUARE_APPLICATION_ID);
        console.log('  - SQUARE_ENVIRONMENT:', SQUARE_ENVIRONMENT);
        console.log('  - Email:', email);
        console.log('  - Business:', business);
        console.log('  - Customer ID:', customer_id);
        console.log('  - Session ID:', sessionId);
        console.log('  - Auth State:', authState);
        console.log('  - Redirect URI:', redirectUri);
        console.log('  - Scopes:', scopes);
        
        const authUrl = `${authEndpoint}?client_id=${encodeURIComponent(SQUARE_APPLICATION_ID)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${authState}`;
        
        // DEBUGGING: Log the final constructed URL
        console.log('🔍 DEBUG: Final OAuth URL');
        console.log('  - Auth Endpoint:', authEndpoint);
        console.log('  - Full Auth URL:', authUrl);
        console.log('  - Encoded Redirect URI:', encodeURIComponent(redirectUri));
        
        console.log(`OAuth started for email: ${email}, business: ${business}, session: ${sessionId}`);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                authUrl: authUrl,
                sessionId: sessionId,
                message: 'Redirecting to Square OAuth',
                debug: {
                    frontendUrl: FRONTEND_URL,
                    redirectUri: redirectUri,
                    encodedRedirectUri: encodeURIComponent(redirectUri),
                    environment: SQUARE_ENVIRONMENT
                }
            })
        };
        
    } catch (error) {
        console.error('Error starting OAuth:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                error: 'Failed to start OAuth flow',
                details: error.message 
            })
        };
    }
}

// Handle OAuth callback
async function handleOAuthCallback(event) {
    try {
        const queryParams = new URLSearchParams(event.queryStringParameters || {});
        const code = queryParams.get('code');
        const state = queryParams.get('state');
        const error = queryParams.get('error');
        
        if (error) {
            console.error('OAuth error:', error);
            return {
                statusCode: 400,
                headers: {
                "Content-Type": "application/json"
            },
                body: JSON.stringify({ 
                    error: 'OAuth authorization failed',
                    details: error 
                })
            };
        }
        
        if (!code) {
                    return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Authorization code is required' })
        };
        }
        
        // Extract vendor data from session storage using state as session ID
        let vendorEmail = 'unknown@email.com';
        let vendorBusiness = 'Unknown Business';
        let vendorCustomerId = null;
        
        if (state) {
            const session = vendorSessions.get(state);
            if (session) {
                vendorEmail = session.email || 'unknown@email.com';
                vendorBusiness = session.business || 'Unknown Business';
                vendorCustomerId = session.customer_id || null;
                console.log('🔍 DEBUG: Retrieved vendor data from session');
                console.log('  - Email:', vendorEmail);
                console.log('  - Business:', vendorBusiness);
                console.log('  - Customer ID:', vendorCustomerId);
                console.log('  - Session ID:', state);
                
                // Clean up the session after use
                vendorSessions.delete(state);
            } else {
                console.warn('Session not found for state:', state);
                console.log('Available sessions:', Array.from(vendorSessions.keys()));
            }
        }
        
        // Exchange authorization code for access token
        const tokenEndpoint = 'https://connect.squareup.com/oauth2/token';
        // Use the Lambda's own endpoint for OAuth callback - this must match what's configured in Square
        const redirectUri = `${FRONTEND_URL}/square-oauth-callback`;
        
        const tokenData = {
            client_id: SQUARE_APPLICATION_ID,
            client_secret: SQUARE_APPLICATION_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        };
        
        const tokenOptions = {
            hostname: 'connect.squareup.com',
            port: 443,
            path: '/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Square-Version': '2024-12-18'
            }
        };
        
        const postData = new URLSearchParams(tokenData).toString();
        
        const tokenResponse = await makeRequest(tokenOptions, postData);
        
        if (tokenResponse.status !== 200) {
            console.error('Token exchange failed:', tokenResponse);
            return {
                statusCode: 400,
                headers: {
                "Content-Type": "application/json"
            },
                body: JSON.stringify({ 
                    error: 'Failed to exchange authorization code for access token',
                    details: tokenResponse.data 
                })
            };
        }
        
        const { access_token, refresh_token, merchant_id } = tokenResponse.data;
        
        // Get vendor data from the OAuth request
        const email = event.queryStringParameters?.email || 'unknown@email.com';
        const business = event.queryStringParameters?.business || 'Unknown Business';
        
        console.log(`OAuth completed successfully for merchant: ${merchant_id}`);
        console.log(`Vendor data: ${business} (${email})`);
        
        // Save vendor data to DynamoDB with both customer_id and merchantId
        if (vendorCustomerId && merchant_id) {
            try {
                console.log('💾 Saving vendor data to DynamoDB...');
                await saveVendorToDynamoDB(
                    vendorCustomerId,    // customer_id from signup
                    merchant_id,         // merchantId from Square
                    access_token,        // Square access token
                    refresh_token,       // Square refresh token
                    vendorEmail,         // email from session
                    vendorBusiness       // business from session
                );
                console.log('✅ Vendor data successfully linked in DynamoDB');
                
                // Update vendor record in vendor-updates-table with Square connection data
                try {
                    console.log('🔄 Updating vendor record in vendor-updates-table...');
                    await updateVendorRecordWithSquareData(
                        vendorCustomerId,
                        merchant_id,
                        access_token,
                        refresh_token,
                        vendorEmail
                    );
                    console.log('✅ Vendor record updated in vendor-updates-table');
                } catch (updateError) {
                    console.error('❌ Failed to update vendor record in vendor-updates-table:', updateError);
                    // Continue with the flow even if update fails
                }
                
            } catch (dbError) {
                console.error('❌ Failed to save vendor data to DynamoDB:', dbError);
                // Continue with the flow even if DB save fails
            }
        } else {
            console.warn('⚠️ Missing customer_id or merchant_id, cannot save to DynamoDB');
        }
        
        // Redirect to Lambda's own success page with vendor data
        const successUrl = `${FRONTEND_URL}/square-success?merchant_id=${merchant_id}&business=${encodeURIComponent(business)}&email=${encodeURIComponent(email)}&customer_id=${encodeURIComponent(vendorCustomerId || '')}`;
        
        // Return HTML redirect page instead of JSON
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Square Integration Successful</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
        h1 { color: #28a745; text-align: center; margin-bottom: 10px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .info-item { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #495057; }
        .info-value { color: #6c757d; }
        .button-group { text-align: center; }
        .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">🎉</div>
        <h1>Integration Successful!</h1>
        <p class="subtitle">Your Square account is now connected to EzDrink</p>
        
        <div class="info-box">
            <h3>Integration Details</h3>
            <div class="info-item">
                <span class="info-label">Merchant ID:</span>
                <span class="info-value">${merchant_id}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Business Name:</span>
                <span class="info-value">${business}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${email}</span>
            </div>
        </div>
        
        <div class="button-group">
            <a href="https://seamlessly.us" class="btn btn-primary">Go to EzDrink</a>
            <a href="https://app.squareup.com" class="btn btn-secondary">Square Dashboard</a>
        </div>
    </div>
</body>
</html>`;
        
        return {
            statusCode: 200,
            headers: {
                
                'Content-Type': 'text/html'
            },
            body: htmlContent
        };
        
    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                error: 'Failed to complete OAuth flow',
                details: error.message 
            })
        };
    }
}

// Handle sessions debug endpoint
async function handleGetSessions(event) {
    try {
        const sessions = Array.from(vendorSessions.entries()).map(([id, session]) => ({
            id: id,
            email: session.email,
            business: session.business,
            createdAt: new Date(session.createdAt).toISOString(),
            age: Math.round((Date.now() - session.createdAt) / 1000) + 's ago'
        }));
        
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                sessionCount: vendorSessions.size,
                sessions: sessions,
                message: 'Current vendor sessions'
            })
        };
        
    } catch (error) {
        console.error('Error getting sessions:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                error: 'Failed to get sessions',
                details: error.message 
            })
        };
    }
}

// Handle Square success page
async function handleSquareSuccess(event) {
    try {
        const queryParams = new URLSearchParams(event.queryStringParameters || {});
        const merchantId = queryParams.get('merchant_id');
        const business = queryParams.get('business');
        const email = queryParams.get('email');
        
        if (!merchantId) {
            return {
                statusCode: 400,
                headers: {
                "Content-Type": "application/json"
            },
                body: JSON.stringify({ error: 'Merchant ID is required' })
            };
        }
        
        // Return HTML success page with EzDrink styling
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Square Integration Success - EzDrink</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #121212;
            color: #ffffff;
            line-height: 1.6;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }
        
        /* Grid Background Pattern */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
            z-index: -2;
        }
        
        /* Gradient Overlays */
        body::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(212, 175, 55, 0.08) 0%, transparent 50%);
            z-index: -1;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .success-card {
            background: #0a0a0a;
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 0 30px rgba(212, 175, 55, 0.15);
            backdrop-filter: blur(10px);
            width: 100%;
            max-width: 600px;
        }
        
        .success-icon {
            font-size: 80px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #d4af37, #f5d76e, #926f34);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        h1 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #d4af37, #f5d76e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: rgba(255, 255, 255, 0.7);
            font-size: 16px;
            margin-bottom: 40px;
            font-weight: 300;
        }
        
        .info-box {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 10px;
            padding: 25px;
            margin: 30px 0;
            text-align: left;
        }
        
        .info-box h3 {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #d4af37;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 500;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .info-value {
            font-weight: 600;
            color: #ffffff;
            font-family: 'Monaco', 'Menlo', monospace;
            background: rgba(212, 175, 55, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .next-steps {
            background: rgba(212, 175, 55, 0.05);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 10px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .next-steps h3 {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #d4af37;
        }
        
        .next-steps p {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 15px;
        }
        
        .next-steps ul {
            list-style: none;
            padding: 0;
        }
        
        .next-steps li {
            color: rgba(255, 255, 255, 0.7);
            padding: 8px 0;
            position: relative;
            padding-left: 25px;
        }
        
        .next-steps li::before {
            content: '✨';
            position: absolute;
            left: 0;
            color: #d4af37;
        }
        
        .button-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 40px;
            flex-wrap: wrap;
        }
        
        .btn {
            display: inline-block;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            min-width: 160px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #d4af37, #f5d76e, #926f34);
            color: #000000;
            box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(212, 175, 55, 0.3);
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            border: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(212, 175, 55, 0.5);
        }
        
        @media (max-width: 768px) {
            .container { padding: 20px 15px; }
            .success-card { padding: 30px 20px; }
            h1 { font-size: 28px; }
            .button-group { flex-direction: column; align-items: center; }
            .btn { width: 100%; max-width: 280px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-card">
            <div class="success-icon">🎉</div>
            <h1>Integration Successful!</h1>
            <p class="subtitle">Your Square account is now connected to EzDrink</p>
            
            <div class="info-box">
                <h3>Integration Details</h3>
                <div class="info-item">
                    <span class="info-label">Merchant ID:</span>
                    <span class="info-value">${merchantId}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Name:</span>
                    <span class="info-value">${business || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${email || 'N/A'}</span>
                </div>
            </div>
            
            <div class="next-steps">
                <h3>What Happens Next?</h3>
                <p>Your Square account is now fully integrated with the EzDrink platform!</p>
                <ul>
                    <li>Mobile orders will flow directly to your Square POS</li>
                    <li>Your menu and inventory will sync automatically</li>
                    <li>Real-time order notifications and updates</li>
                    <li>Access to advanced analytics and insights</li>
                </ul>
            </div>
            
            <div class="button-group">
                <a href="https://seamlessly.us" class="btn btn-primary">Go to EzDrink</a>
                <a href="https://app.squareup.com" class="btn btn-secondary">Square Dashboard</a>
            </div>
        </div>
    </div>
</body>
</html>`;
        
        return {
            statusCode: 200,
            headers: {
                
                'Content-Type': 'text/html'
            },
            body: htmlContent
        };
        
    } catch (error) {
        console.error('Error handling Square success page:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                error: 'Failed to display success page',
                details: error.message 
            })
        };
    }
}

// Test Square connection
async function testSquareConnection(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { access_token, merchant_id } = body;
        
        if (!access_token || !merchant_id) {
            return {
                statusCode: 400,
                headers: {
                "Content-Type": "application/json"
            },
                body: JSON.stringify({ error: 'Access token and merchant ID are required' })
            };
        }
        
        // Test Square API connection by getting merchant info
        const apiOptions = {
            hostname: 'connect.squareup.com',
            port: 443,
            path: '/v2/merchants',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Square-Version': '2024-12-18'
            }
        };
        
        const apiResponse = await makeRequest(apiOptions);
        
        if (apiResponse.status !== 200) {
            return {
                statusCode: 400,
                headers: {
                "Content-Type": "application/json"
            },
                body: JSON.stringify({ 
                    error: 'Failed to connect to Square API',
                    details: apiResponse.data 
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                message: 'Square connection test successful',
                merchant_data: apiResponse.data
            })
        };
        
    } catch (error) {
        console.error('Error testing Square connection:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                error: 'Failed to test Square connection',
                details: error.message 
            })
        };
    }
}

// Main Lambda handler
exports.handler = async (event) => {
    console.log('=== SQUARE LAMBDA HANDLER ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Environment:', SQUARE_ENVIRONMENT);
    console.log('Application ID:', SQUARE_APPLICATION_ID ? 'Configured' : 'Missing');
    
    // DEBUGGING: Log all environment variables
    console.log('🔍 DEBUG: Environment Variables');
    console.log('  - FRONTEND_URL:', FRONTEND_URL);
    console.log('  - SQUARE_APPLICATION_ID:', SQUARE_APPLICATION_ID);
    console.log('  - SQUARE_ENVIRONMENT:', SQUARE_ENVIRONMENT);
    console.log('  - DATABASE_URL:', DATABASE_URL ? 'Configured' : 'Missing');
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
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
    
    const path = event.rawPath || event.path || '';
    const method = event.httpMethod || 'GET';
    
    try {
        // Route requests based on path and method
        if (path === '/start-oauth' && method === 'GET') {
            return await handleStartOAuth(event);
        }
        
        if ((path === '/oauth-callback' || path === '/square-oauth-callback') && method === 'GET') {
            return await handleOAuthCallback(event);
        }
        
        if (path === '/square-success' && method === 'GET') {
            return await handleSquareSuccess(event);
        }
        
        if (path === '/sessions' && method === 'GET') {
            return await handleGetSessions(event);
        }

        if (path === '/manual-token-refresh' && method === 'GET') {
            return await handleManualTokenRefresh(event);
        }
        
        if (path === '/test-connection' && method === 'POST') {
            return await testSquareConnection(event);
        }
        
        // Default response
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': getCorsOrigin(event),
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            body: JSON.stringify({ 
                error: 'Endpoint not found',
                available_endpoints: [
                    'GET /start-oauth',
                    'GET /oauth-callback',
                    'GET /square-oauth-callback',
                    'GET /square-success',
                    'GET /sessions',
                    'GET /manual-token-refresh',
                    'POST /test-connection'
                ]
            })
        };
        
    } catch (error) {
        console.error('Lambda handler error:', error);
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
                details: error.message 
            })
        };
    }
};
