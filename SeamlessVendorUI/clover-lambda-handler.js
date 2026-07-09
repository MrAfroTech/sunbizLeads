// Enhanced Lambda callback handler for Clover OAuth with token exchange
// Replicated from Square's proven OAuth flow pattern

// Load environment variables
// Environment variables are set in Lambda configuration

// Clover application credentials from environment variables
const CLOVER_APPLICATION_ID = process.env.CLOVER_CLIENT_ID || process.env.REACT_APP_CLOVER_CLIENT_ID;
const CLOVER_CLIENT_SECRET = process.env.CLOVER_CLIENT_SECRET || process.env.REACT_APP_CLOVER_CLIENT_SECRET;
const CLOVER_ENVIRONMENT = process.env.CLOVER_ENVIRONMENT || 'production'; // 'sandbox' or 'production'

// AWS SDK v3 imports
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const https = require('https');

// Configure AWS SDK v3
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

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

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: getCorsHeaders(event),
                body: ''
            };
        }

        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        console.log('Query parameters:', queryParams);
        
        const { code, state, merchant_id, employee_id, client_id } = queryParams;
        
        // Validate required parameters
        if (!code) {
            console.error('Missing authorization code');
            return {
                statusCode: 400,
                headers: {
                    ...getCorsHeaders(event),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Missing authorization code',
                    receivedParams: queryParams
                })
            };
        }

        // State parameter is optional for Clover OAuth
        // If not provided, we'll generate a token based on merchant_id and employee_id
        let token = state;
        if (!token) {
            token = `clover_${merchant_id}_${employee_id}_${Date.now()}`;
            console.log('No state parameter provided, generated token:', token);
        }
        
        console.log('Processing OAuth callback with token:', token);
        
        // Create vendor data from Clover OAuth parameters
        const vendorData = {
            customer_id: `clover_${merchant_id}`,
            businessName: `Clover Business ${merchant_id}`,
            email: `clover_${merchant_id}@seamlessly.us`
        };

        // Exchange authorization code for access token
        const tokenResponse = await exchangeCodeForToken(code);
        console.log('Token exchange successful');

        // Store credentials in DynamoDB
        const tableName = process.env.DYNAMODB_CLOVER_TABLE || 'seamless-clover-tokens';
        
        // Ensure expires_in is a valid number
        const expiresIn = parseInt(tokenResponse.expires_in) || 3600; // Default to 1 hour if invalid
        const expiresAt = Date.now() + (expiresIn * 1000);
        
        const item = {
            vendor_id: vendorData.customer_id || `clover_${merchant_id}`,
            merchant_id: merchant_id || 'unknown',
            employee_id: employee_id || 'unknown',
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_at: expiresAt,
            environment: process.env.CLOVER_ENVIRONMENT || 'production',
            business_name: vendorData.businessName || 'Unknown Business',
            email: vendorData.email || 'unknown@example.com',
            pos_system: 'clover',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await dynamodb.send(new PutCommand({
            TableName: tableName,
            Item: item
        }));

        console.log('Credentials stored in DynamoDB');

        // Redirect to frontend
        const frontendUrl = process.env.CLOVER_FRONTEND_URL || 'https://seamlessly.us';
        const redirectUrl = `${frontendUrl}/success?status=success&vendor_id=${item.vendor_id}&merchant_id=${merchant_id}&pos_system=clover`;

        return {
            statusCode: 302,
            headers: {
                'Location': redirectUrl,
                ...getCorsHeaders(event)
            },
            body: ''
        };

    } catch (error) {
        console.error('Error processing OAuth callback:', error);
        
        const frontendUrl = process.env.CLOVER_FRONTEND_URL || 'https://seamlessly.us';
        const errorRedirectUrl = `${frontendUrl}/error?error=${encodeURIComponent(error.message)}&pos_system=clover`;

        return {
            statusCode: 302,
            headers: {
                'Location': errorRedirectUrl,
                ...getCorsHeaders(event)
            },
            body: ''
        };
    }
};

async function exchangeCodeForToken(authorizationCode) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            client_id: process.env.CLOVER_CLIENT_ID,
            client_secret: process.env.CLOVER_CLIENT_SECRET,
            code: authorizationCode,
            grant_type: 'authorization_code'
        });

        const options = {
            hostname: 'clover.com',
            port: 443,
            path: '/oauth/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.error) {
                        reject(new Error(`Clover API error: ${response.error_description || response.error}`));
                    } else {
                        resolve(response);
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse token response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.write(postData);
        req.end();
    });
}
