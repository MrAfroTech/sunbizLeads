// Clover OAuth Callback Handler for Vercel
// This handles the OAuth callback from Clover and exchanges the authorization code for access tokens

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Configure AWS SDK
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        return res.status(200).end();
    }

    // Only allow GET requests (OAuth callbacks are GET requests)
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🟢 [CLOVER OAUTH] Processing OAuth callback');
        
        // Parse query parameters
        const { code, state, merchant_id, employee_id, client_id } = req.query;
        
        console.log('Query parameters:', { code: code ? '***' : 'missing', state, merchant_id, employee_id, client_id });
        
        // Validate required parameters
        if (!code) {
            console.error('Missing authorization code');
            return res.status(400).json({
                error: 'Missing authorization code',
                receivedParams: req.query
            });
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

        // Redirect to frontend success page
        const frontendUrl = process.env.CLOVER_FRONTEND_URL || 'https://seamlessly.us';
        const redirectUrl = `${frontendUrl}/success?status=success&vendor_id=${item.vendor_id}&merchant_id=${merchant_id}&pos_system=clover`;

        // Return HTML redirect page
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clover Integration Successful</title>
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
        <p class="subtitle">Your Clover account is now connected to Seamless</p>
        
        <div class="info-box">
            <h3>Integration Details</h3>
            <div class="info-item">
                <span class="info-label">Merchant ID:</span>
                <span class="info-value">${merchant_id}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Business Name:</span>
                <span class="info-value">${vendorData.businessName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">POS System:</span>
                <span class="info-value">Clover</span>
            </div>
        </div>
        
        <div class="button-group">
            <a href="${redirectUrl}" class="btn btn-primary">Continue to Dashboard</a>
            <a href="${frontendUrl}" class="btn btn-secondary">Go Home</a>
        </div>
    </div>
    
    <script>
        // Auto-redirect after 3 seconds
        setTimeout(() => {
            window.location.href = '${redirectUrl}';
        }, 3000);
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(htmlContent);

    } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
        
        const frontendUrl = process.env.CLOVER_FRONTEND_URL || 'https://seamlessly.us';
        const errorRedirectUrl = `${frontendUrl}/error?error=${encodeURIComponent(error.message)}&pos_system=clover`;

        // Return error HTML page
        const errorHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .error-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
        h1 { color: #dc3545; text-align: center; margin-bottom: 10px; }
        .error-message { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #f5c6cb; }
        .button-group { text-align: center; }
        .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Integration Failed</h1>
        <div class="error-message">
            <strong>Error:</strong> ${error.message}
        </div>
        
        <div class="button-group">
            <a href="${errorRedirectUrl}" class="btn btn-primary">Go to Error Page</a>
            <a href="${frontendUrl}" class="btn btn-secondary">Go Home</a>
        </div>
    </div>
    
    <script>
        // Auto-redirect after 5 seconds
        setTimeout(() => {
            window.location.href = '${errorRedirectUrl}';
        }, 5000);
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(500).send(errorHtml);
    }
}

async function exchangeCodeForToken(authorizationCode) {
    return new Promise((resolve, reject) => {
        // Clover expects form-urlencoded data, not JSON
        const postData = new URLSearchParams({
            client_id: process.env.CLOVER_CLIENT_ID,
            client_secret: process.env.CLOVER_CLIENT_SECRET,
            code: authorizationCode,
            grant_type: 'authorization_code'
        }).toString();

        console.log('🔄 [CLOVER OAUTH] Exchanging code for token...');
        console.log('Client ID:', process.env.CLOVER_CLIENT_ID ? '***' : 'NOT SET');
        console.log('Client Secret:', process.env.CLOVER_CLIENT_SECRET ? '***' : 'NOT SET');
        console.log('Authorization Code:', authorizationCode ? '***' : 'NOT SET');
        console.log('Request URL:', 'https://clover.com/oauth/token');

        const options = {
            hostname: 'clover.com',
            port: 443,
            path: '/oauth/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'SeamlessMarketplace/1.0',
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        };

        const https = require('https');
        const req = https.request(options, (res) => {
            console.log('📡 [CLOVER OAUTH] Response status:', res.statusCode);
            console.log('📡 [CLOVER OAUTH] Response headers:', res.headers);
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
                console.log('📡 [CLOVER OAUTH] Received chunk size:', chunk.length);
            });
            
            res.on('end', () => {
                console.log('📡 [CLOVER OAUTH] Response complete. Total data length:', data.length);
                console.log('📡 [CLOVER OAUTH] Raw response data:', data);
                
                if (!data || data.trim() === '') {
                    reject(new Error('Empty response from Clover API'));
                    return;
                }
                
                try {
                    const response = JSON.parse(data);
                    console.log('✅ [CLOVER OAUTH] Successfully parsed JSON response');
                    
                    if (response.error) {
                        console.error('❌ [CLOVER OAUTH] Clover API error:', response);
                        reject(new Error(`Clover API error: ${response.error_description || response.error}`));
                    } else {
                        console.log('✅ [CLOVER OAUTH] Token exchange successful');
                        resolve(response);
                    }
                } catch (parseError) {
                    console.error('❌ [CLOVER OAUTH] JSON parse error:', parseError);
                    console.error('❌ [CLOVER OAUTH] Raw data that failed to parse:', data);
                    reject(new Error(`Failed to parse token response: ${parseError.message}. Raw data: ${data.substring(0, 200)}...`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ [CLOVER OAUTH] Request error:', error);
            reject(new Error(`Request failed: ${error.message}`));
        });

        req.on('timeout', () => {
            console.error('⏰ [CLOVER OAUTH] Request timeout');
            req.destroy();
            reject(new Error('Request timeout - Clover API took too long to respond'));
        });

        req.on('response', (res) => {
            console.log('📡 [CLOVER OAUTH] Response received with status:', res.statusCode);
        });

        console.log('📤 [CLOVER OAUTH] Sending request to Clover...');
        console.log('📤 [CLOVER OAUTH] Request data:', postData);
        req.write(postData);
        req.end();
    });
}
