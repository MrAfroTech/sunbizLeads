// Simple Klaviyo test
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

    const KLAVIYO_API_KEY = 'pk_6811fc9f50361d1357c49b1bd91a029acc';

    try {
        console.log('🔧 Testing Klaviyo API...');
        
        const response = await fetch('https://a.klaviyo.com/api/profiles/', {
            method: 'POST',
            headers: {
                'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Revision': '2023-12-15'
            },
            body: JSON.stringify({
                data: {
                    type: 'profile',
                    attributes: {
                        email: 'test@example.com',
                        first_name: 'Test',
                        last_name: 'User',
                        properties: {
                            $consent: ['email', 'sms'],
                            source: 'test'
                        }
                    }
                }
            })
        });

        console.log('🔧 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('🔧 Error:', errorText);
            return res.json({
                success: false,
                error: `HTTP ${response.status}`,
                details: errorText
            });
        }

        const result = await response.json();
        console.log('🔧 Success:', result);

        return res.json({
            success: true,
            profileId: result.data.id,
            message: 'Klaviyo profile created successfully'
        });

    } catch (error) {
        console.error('🔧 Error:', error);
        return res.json({
            success: false,
            error: error.message
        });
    }
} 