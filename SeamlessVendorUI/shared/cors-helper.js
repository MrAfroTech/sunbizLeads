/**
 * CORS helper utilities for OAuth integrations
 */

/**
 * Get CORS origin based on request origin
 */
function getCorsOrigin(event) {
  const origin = event.headers?.origin || event.headers?.Origin;
  
  // Check if origin matches our patterns
  if (origin === 'https://seamlessly.us' || origin === 'https://www.seamlessly.us') {
    return origin; // Allow both www and non-www versions
  } else if (origin && origin.includes('vercel.app')) {
    return origin; // Allow any Vercel preview URL
  } else if (origin && origin.includes('localhost')) {
    return origin; // Allow localhost for development
  } else {
    return 'https://seamlessly.us'; // Default to production
  }
}

/**
 * Get standard CORS headers
 */
function getCorsHeaders(event) {
  const corsOrigin = getCorsOrigin(event);
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // 24 hours
  };
}

/**
 * Handle preflight OPTIONS request
 */
function handlePreflight(event) {
  const method = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;
  
  if (method === 'OPTIONS' || method === 'options') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event),
      body: ''
    };
  }
  
  return null; // Not a preflight request
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response, event) {
  const corsHeaders = getCorsHeaders(event);
  
  return {
    ...response,
    headers: {
      ...corsHeaders,
      ...response.headers
    }
  };
}

/**
 * Create CORS-enabled response
 */
function createCorsResponse(statusCode, body, event, additionalHeaders = {}) {
  const corsHeaders = getCorsHeaders(event);
  
  return {
    statusCode: statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...additionalHeaders
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

/**
 * Create CORS-enabled error response
 */
function createCorsErrorResponse(statusCode, message, event, error = null) {
  const responseBody = {
    success: false,
    message: message
  };
  
  if (error) {
    responseBody.error = error.message || error;
  }
  
  return createCorsResponse(statusCode, responseBody, event);
}

/**
 * Create CORS-enabled success response
 */
function createCorsSuccessResponse(data = {}, message = 'Operation completed successfully', event) {
  const responseBody = {
    success: true,
    message: message,
    data: data
  };
  
  return createCorsResponse(200, responseBody, event);
}

module.exports = {
  getCorsOrigin,
  getCorsHeaders,
  handlePreflight,
  addCorsHeaders,
  createCorsResponse,
  createCorsErrorResponse,
  createCorsSuccessResponse
};
