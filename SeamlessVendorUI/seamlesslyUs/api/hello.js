export default function handler(req, res) {
    console.log('🔧 === HELLO ENV TEST ===');
    console.log('🔧 All env vars:', Object.keys(process.env));
    console.log('🔧 Klaviyo vars:', Object.keys(process.env).filter(key => key.includes('KLAVIYO')));
    
    res.status(200).json({ 
        message: 'Hello from Vercel API!',
        timestamp: new Date().toISOString(),
        method: req.method,
        envTest: {
            totalEnvVars: Object.keys(process.env).length,
            klaviyoVars: Object.keys(process.env).filter(key => key.includes('KLAVIYO')),
            hasKlaviyoPrivate: !!process.env.KLAVIYO_PRIVATE_API_KEY,
            hasKlaviyoList: !!process.env.KLAVIYO_LIST_ID
        }
    });
} 