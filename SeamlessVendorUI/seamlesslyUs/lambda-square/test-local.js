// Local test script for Square Lambda Handler
// Run with: node test-local.js

const { handler } = require('./square-lambda-handler');

// Mock environment variables
process.env.SQUARE_APPLICATION_ID = 'test-app-id';
process.env.SQUARE_APPLICATION_SECRET = 'test-app-secret';
process.env.SQUARE_ENVIRONMENT = 'production';
process.env.FRONTEND_URL = 'https://localhost:3000';

// Test event for start-oauth endpoint
const startOAuthEvent = {
    httpMethod: 'GET',
    rawPath: '/start-oauth',
    queryStringParameters: {
        email: 'test@example.com',
        business: 'Test Business'
    }
};

// Test event for oauth-callback endpoint
const oauthCallbackEvent = {
    httpMethod: 'GET',
    rawPath: '/oauth-callback',
    queryStringParameters: {
        code: 'test-auth-code',
        state: 'test-state'
    }
};

// Test event for test-connection endpoint
const testConnectionEvent = {
    httpMethod: 'POST',
    rawPath: '/test-connection',
    body: JSON.stringify({
        access_token: 'test-access-token',
        merchant_id: 'test-merchant-id'
    })
};

// Test event for unknown endpoint
const unknownEvent = {
    httpMethod: 'GET',
    rawPath: '/unknown',
    queryStringParameters: {}
};

// Test event for CORS preflight
const corsEvent = {
    httpMethod: 'OPTIONS',
    rawPath: '/start-oauth',
    queryStringParameters: {}
};

async function runTests() {
    console.log('🧪 Testing Square Lambda Handler...\n');

    try {
        // Test 1: Start OAuth
        console.log('📋 Test 1: Start OAuth');
        const startOAuthResult = await handler(startOAuthEvent);
        console.log('Status:', startOAuthResult.statusCode);
        console.log('Response:', JSON.parse(startOAuthResult.body));
        console.log('');

        // Test 2: OAuth Callback
        console.log('📋 Test 2: OAuth Callback');
        const oauthCallbackResult = await handler(oauthCallbackEvent);
        console.log('Status:', oauthCallbackResult.statusCode);
        console.log('Response:', JSON.parse(oauthCallbackResult.body));
        console.log('');

        // Test 3: Test Connection
        console.log('📋 Test 3: Test Connection');
        const testConnectionResult = await handler(testConnectionEvent);
        console.log('Status:', testConnectionResult.statusCode);
        console.log('Response:', JSON.parse(testConnectionResult.body));
        console.log('');

        // Test 4: Unknown Endpoint
        console.log('📋 Test 4: Unknown Endpoint');
        const unknownResult = await handler(unknownEvent);
        console.log('Status:', unknownResult.statusCode);
        console.log('Response:', JSON.parse(unknownResult.body));
        console.log('');

        // Test 5: CORS Preflight
        console.log('📋 Test 5: CORS Preflight');
        const corsResult = await handler(corsEvent);
        console.log('Status:', corsResult.statusCode);
        console.log('Response:', corsResult.body);
        console.log('');

        console.log('✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
runTests();
