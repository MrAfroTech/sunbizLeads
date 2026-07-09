// api/supabase-config.js — Serves Supabase client config with CORS for Vercel and eventbrella.com origins

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-zA-Z0-9.-]+\.vercel\.app$/,           // any *.vercel.app (incl. preview: x--y-z.vercel.app)
  /^https:\/\/([a-zA-Z0-9-]+\.)*eventbrella\.com$/,    // *.eventbrella.com and eventbrella.com
];

function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

module.exports = async (req, res) => {
  const origin = req.headers.origin || req.headers.Origin;

  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
  });
};
