const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'OK' })
        };
    }

    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const { code, state, redirect_uri } = body;

        if (!code) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing authorization code',
                    message: 'Authorization code is required'
                })
            };
        }

        console.log('Received authorization code:', code);
        console.log('State data:', state);
        console.log('Redirect URI:', redirect_uri);

        // Exchange the authorization code for an access token
        const tokenResponse = await exchangeCodeForToken(code, redirect_uri);
        
        if (!tokenResponse.access_token) {
            throw new Error('Failed to obtain access token from PayPal');
        }

        // Get merchant information using the access token
        const merchantInfo = await getMerchantInfo(tokenResponse.access_token);
        
        // Store the token and merchant information in DynamoDB
        const storageResult = await storeTokenData(tokenResponse, merchantInfo, state);
        
        console.log('Token exchange completed successfully');
        console.log('Merchant ID:', merchantInfo.merchant_id);
        console.log('Merchant Email:', merchantInfo.email);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'PayPal integration completed successfully',
                merchant_id: merchantInfo.merchant_id,
                merchant_email: merchantInfo.email,
                business_name: merchantInfo.business_name || state?.businessName,
                integration_id: storageResult.integration_id
            })
        };

    } catch (error) {
        console.error('Error in exchange-token:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message || 'Failed to process PayPal authorization'
            })
        };
    }
};

async function exchangeCodeForToken(code, redirect_uri) {
    const tokenUrl = process.env.PAYPAL_ENVIRONMENT === 'sandbox' 
        ? 'https://api-m.sandbox.paypal.com/v1/oauth2/token'
        : 'https://api-m.paypal.com/v1/oauth2/token';

    const credentials = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal token exchange error:', errorText);
        throw new Error(`PayPal token exchange failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

async function getMerchantInfo(accessToken) {
    const userInfoUrl = process.env.PAYPAL_ENVIRONMENT === 'sandbox'
        ? 'https://api-m.sandbox.paypal.com/v1/identity/oauth2/userinfo'
        : 'https://api-m.paypal.com/v1/identity/oauth2/userinfo';

    const response = await fetch(userInfoUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get merchant info: ${response.status} ${response.statusText}`);
    }

    const userInfo = await response.json();
    
    return {
        merchant_id: userInfo.payer_id || userInfo.user_id,
        email: userInfo.email,
        business_name: userInfo.business_name || userInfo.name,
        verified: userInfo.verified || false
    };
}

async function storeTokenData(tokenResponse, merchantInfo, state) {
    const tableName = process.env.DYNAMODB_PAYPAL_TABLE || 'seamless-paypal-tokens';
    const integrationId = `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const item = {
        integration_id: integrationId,
        merchant_id: merchantInfo.merchant_id,
        merchant_email: merchantInfo.email,
        business_name: merchantInfo.business_name || state?.businessName,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        scope: tokenResponse.scope,
        integration_data: state || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
    };

    await docClient.send(new PutCommand({
        TableName: tableName,
        Item: item
    }));

    return { integration_id: integrationId };
}
