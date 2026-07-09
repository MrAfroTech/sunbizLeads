// CORS Middleware for Vercel API Routes
// This ensures consistent CORS handling across all endpoints

export function enableCORS(res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function handleCORS(req, res) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    enableCORS(res);
    res.status(200).end();
    return true; // Indicates this was a preflight request
  }
  
  // Enable CORS for actual requests
  enableCORS(res);
  return false; // Indicates this was not a preflight request
}

// Higher-order function to wrap API handlers with CORS
export function withCORS(handler) {
  return async (req, res) => {
    const isPreflight = handleCORS(req, res);
    if (isPreflight) return;
    
    return handler(req, res);
  };
}
