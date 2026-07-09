const { createClient } = require('@supabase/supabase-js');

function readSupabaseEnv() {
  const url =
    process.env.SUPABASE_SCAN_AND_SCALE_URL ||
    process.env.VITE_SUPABASE_URL_SALES_MASTERY ||
    process.env.REACT_APP_SUPABASE_URL_SALES_MASTERY ||
    process.env.VITE_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SCAN_AND_SCALE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY_SALES_MASTERY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY;
  return { url, key };
}

function parseJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = async function ingestLeadEvent(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { url, key } = readSupabaseEnv();
  if (!url || !key) {
    return res.status(503).json({ success: false });
  }

  try {
    const fnRes = await fetch(`${url}/functions/v1/ingest-lead-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(parseJsonBody(req)),
    });
    const body = await fnRes.json().catch(() => ({}));
    return res.status(fnRes.status).json(body);
  } catch {
    return res.status(500).json({ success: false });
  }
};
