// CommonJS version of environment test
module.exports = async function handler(req, res) {
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

    console.log('🔧 === COMMONJS ENV TEST ===');
    console.log('🔧 Process env keys:', Object.keys(process.env));
    console.log('🔧 Total env vars:', Object.keys(process.env).length);

    return res.json({
        success: true,
        message: 'CommonJS environment test',
        totalEnvVars: Object.keys(process.env).length,
        allEnvVars: Object.keys(process.env).sort(),
        hasKlaviyo: Object.keys(process.env).some(key => key.includes('KLAVIYO')),
        hasPrivate: Object.keys(process.env).some(key => key.includes('PRIVATE')),
        hasList: Object.keys(process.env).some(key => key.includes('LIST'))
    });
}; 