// Simple test endpoint
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    console.log('🔧 Simple test endpoint called');
    console.log('🔧 Request method:', req.method);
    console.log('🔧 Request headers:', req.headers);

    return res.json({
        success: true,
        message: 'Simple test endpoint working',
        timestamp: new Date().toISOString(),
        method: req.method,
        headers: Object.keys(req.headers)
    });
} 