// Test multiple ways to access environment variables
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

    console.log('🔧 === MULTIPLE ENV TEST ===');
    
    // Try multiple ways to access environment variables
    const envVars = {
        // Direct access
        direct: {
            KLAVIYO_PRIVATE_API_KEY: process.env.KLAVIYO_PRIVATE_API_KEY,
            KLAVIYO_LIST_ID: process.env.KLAVIYO_LIST_ID
        },
        // All environment variables
        all: process.env,
        // Keys only
        keys: Object.keys(process.env),
        // Count
        count: Object.keys(process.env).length,
        // Check for any Klaviyo related vars
        klaviyoVars: Object.keys(process.env).filter(key => key.includes('KLAVIYO')),
        // Check for any Private related vars
        privateVars: Object.keys(process.env).filter(key => key.includes('PRIVATE')),
        // Check for any List related vars
        listVars: Object.keys(process.env).filter(key => key.includes('LIST'))
    };

    console.log('🔧 Environment variables test:', envVars);

    return res.json({
        success: true,
        message: 'Multiple environment variable test',
        envVars: envVars,
        hasKlaviyoVars: envVars.klaviyoVars.length > 0,
        hasPrivateVars: envVars.privateVars.length > 0,
        hasListVars: envVars.listVars.length > 0,
        totalEnvVars: envVars.count
    });
} 