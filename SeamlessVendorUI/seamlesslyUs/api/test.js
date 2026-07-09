// Simple test endpoint
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        return res.json({
            success: true,
            message: 'API is working!',
            timestamp: new Date().toISOString(),
            method: req.method
        });
    }

    if (req.method === 'POST') {
        return res.json({
            success: true,
            message: 'POST request received',
            data: req.body,
            timestamp: new Date().toISOString(),
            method: req.method
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
} 