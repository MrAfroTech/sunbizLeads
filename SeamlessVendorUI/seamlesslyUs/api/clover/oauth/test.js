// Test endpoint for Clover OAuth
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // Test the OAuth endpoint directly
    const testOAuthRequest = async () => {
        try {
            const https = require('https');
            
            const postData = new URLSearchParams({
                client_id: process.env.CLOVER_CLIENT_ID || 'NOT_SET',
                client_secret: process.env.CLOVER_CLIENT_SECRET || 'NOT_SET',
                code: 'test_code',
                grant_type: 'authorization_code'
            }).toString();
            
            const options = {
                hostname: 'clover.com',
                port: 443,
                path: '/oauth/token',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'SeamlessMarketplace/1.0'
                },
                timeout: 10000
            };
            
            return new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: data,
                            dataLength: data.length
                        });
                    });
                });
                
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });
                
                req.write(postData);
                req.end();
            });
        } catch (error) {
            return { error: error.message };
        }
    };
    
    // Run the test
    testOAuthRequest().then(result => {
        return res.status(200).json({
            message: 'Clover OAuth API test completed',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            cloverClientId: process.env.CLOVER_CLIENT_ID ? '***' : 'NOT SET',
            cloverClientSecret: process.env.CLOVER_CLIENT_SECRET ? '***' : 'NOT SET',
            cloverRedirectUri: process.env.REACT_APP_CLOVER_REDIRECT_URI || 'NOT SET',
            testResult: result
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'Clover OAuth API test failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    });
}
