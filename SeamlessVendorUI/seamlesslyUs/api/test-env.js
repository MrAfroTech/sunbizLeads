// Test endpoint to check environment variables
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

    console.log('🔧 === ENVIRONMENT VARIABLES TEST ===');
    console.log('🔧 All environment variables:', Object.keys(process.env));
    console.log('🔧 All env vars that start with KLAVIYO:', Object.keys(process.env).filter(key => key.startsWith('KLAVIYO')));
    console.log('🔧 All env vars that contain KLAVIYO:', Object.keys(process.env).filter(key => key.includes('KLAVIYO')));
    console.log('🔧 KLAVIYO_PRIVATE_API_KEY exists:', !!process.env.KLAVIYO_PRIVATE_API_KEY);
    console.log('🔧 KLAVIYO_PRIVATE_API_KEY value:', process.env.KLAVIYO_PRIVATE_API_KEY ? 'SET' : 'NOT SET');
    console.log('🔧 KLAVIYO_LIST_ID exists:', !!process.env.KLAVIYO_LIST_ID);
    console.log('🔧 KLAVIYO_LIST_ID value:', process.env.KLAVIYO_LIST_ID || 'NOT SET');
    console.log('🔧 Total env vars count:', Object.keys(process.env).length);
    console.log('🔧 First 10 env vars:', Object.keys(process.env).slice(0, 10));
    console.log('🔧 === END ENVIRONMENT TEST ===');

    return res.json({
        success: true,
        message: 'Environment variables test',
        klaviyoApiKeyExists: !!process.env.KLAVIYO_PRIVATE_API_KEY,
        klaviyoApiKeySet: process.env.KLAVIYO_PRIVATE_API_KEY ? 'YES' : 'NO',
        klaviyoListIdExists: !!process.env.KLAVIYO_LIST_ID,
        klaviyoListIdValue: process.env.KLAVIYO_LIST_ID || 'NOT SET',
        allEnvVars: Object.keys(process.env).filter(key => key.includes('KLAVIYO')),
        allEnvVarsStartingWithKlaviyo: Object.keys(process.env).filter(key => key.startsWith('KLAVIYO')),
        totalEnvVars: Object.keys(process.env).length,
        sampleEnvVars: Object.keys(process.env).slice(0, 10),
        // Check for alternative naming patterns
        envVarsWithPrivate: Object.keys(process.env).filter(key => key.includes('PRIVATE')),
        envVarsWithList: Object.keys(process.env).filter(key => key.includes('LIST')),
        envVarsWithApi: Object.keys(process.env).filter(key => key.includes('API')),
        // Show all environment variables for debugging
        allEnvVarsList: Object.keys(process.env).sort(),
        // Check specific variable access
        directAccess: {
            KLAVIYO_PRIVATE_API_KEY: process.env.KLAVIYO_PRIVATE_API_KEY ? 'EXISTS' : 'NOT_FOUND',
            KLAVIYO_LIST_ID: process.env.KLAVIYO_LIST_ID ? 'EXISTS' : 'NOT_FOUND'
        }
    });
} 