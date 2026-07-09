// Test endpoint with hardcoded values
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

    // Hardcoded values for testing
    const KLAVIYO_API_KEY = 'pk_6811fc9f50361d1357c49b1bd91a029acc';
    const KLAVIYO_LIST_ID = 'TJr6rx';

    console.log('🔧 === HARDCODED TEST ===');
    console.log('🔧 Hardcoded API Key:', KLAVIYO_API_KEY ? 'SET' : 'NOT SET');
    console.log('🔧 Hardcoded List ID:', KLAVIYO_LIST_ID);

    // Test Klaviyo API call
    try {
        const response = await fetch('https://a.klaviyo.com/api/profiles/', {
            method: 'GET',
            headers: {
                'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Revision': '2023-12-15'
            }
        });

        console.log('🔧 Klaviyo API response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('🔧 Klaviyo API call successful');
            return res.json({
                success: true,
                message: 'Hardcoded test successful',
                klaviyoApiKeySet: 'YES',
                klaviyoListIdSet: 'YES',
                apiCallSuccessful: true,
                responseStatus: response.status
            });
        } else {
            console.log('🔧 Klaviyo API call failed:', response.status);
            return res.json({
                success: false,
                message: 'Hardcoded test failed',
                klaviyoApiKeySet: 'YES',
                klaviyoListIdSet: 'YES',
                apiCallSuccessful: false,
                responseStatus: response.status
            });
        }
    } catch (error) {
        console.error('🔧 Error in hardcoded test:', error);
        return res.json({
            success: false,
            message: 'Hardcoded test error',
            error: error.message
        });
    }
} 