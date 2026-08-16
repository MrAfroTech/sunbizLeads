// api/test.js - Simple test endpoint to verify API routes work
module.exports = async (req, res) => {
  console.log('✅ Test API function loaded and called');
  return res.status(200).json({ 
    message: 'API is working!',
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

