/**
 * Authentication Middleware
 * 
 * Verifies API key from Authorization header or x-api-key header.
 * Prevents unauthorized access to pass generation endpoints.
 */

const jwt = require('jsonwebtoken');

/**
 * Authenticate incoming requests
 */
function authenticateRequest(req, res, next) {
  // Get API key from header
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['authorization']?.replace('Bearer ', '') ||
                 req.query.apiKey;

  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    console.error('API_SECRET_KEY not configured');
    return res.status(500).json({
      success: false,
      error: 'Service configuration error'
    });
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Provide x-api-key header or Authorization: Bearer <key>'
    });
  }

  // Simple string comparison (for shared secret)
  // For JWT tokens, use jwt.verify() instead
  if (apiKey !== expectedKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  // Add rate limiting info to request (can be extended)
  req.authenticated = true;
  next();
}

/**
 * Optional: JWT token verification (if using JWT instead of shared secret)
 */
function authenticateJWT(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'JWT token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.API_SECRET_KEY);
    req.user = decoded;
    req.authenticated = true;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

module.exports = {
  authenticateRequest,
  authenticateJWT
};

