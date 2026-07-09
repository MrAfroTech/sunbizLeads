// Updates brevo_contacts click fields (same DB as playwrightAutomation/scripts/.env).
const { createClient } = require('@supabase/supabase-js');

function readSupabaseEnv() {
  const url =
    process.env.REACT_APP_SUPABASE_URL_SALES_MASTERY ||
    process.env.VITE_SUPABASE_URL_SALES_MASTERY ||
    process.env.REACT_APP_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key =
    process.env.REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY ||
    process.env.VITE_SUPABASE_ANON_KEY_SALES_MASTERY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
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

function normalizeEmail(raw) {
  try {
    return decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim().toLowerCase();
  } catch {
    return String(raw).trim().toLowerCase();
  }
}

module.exports = async function logEmailClick(req, res) {
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
    return res.status(503).json({ ok: false });
  }

  const body = parseJsonBody(req);
  const rawContact = body.contact;
  if (!rawContact || !String(rawContact).trim()) {
    return res.status(400).end();
  }

  const email = normalizeEmail(rawContact);
  if (!email) {
    return res.status(400).end();
  }

  const rawCampaign = body.campaign;
  const campaign =
    rawCampaign == null || String(rawCampaign).trim() === ''
      ? null
      : String(rawCampaign).trim();

  const rawPath = body.path;
  const path =
    rawPath == null || String(rawPath).trim() === ''
      ? null
      : String(rawPath).trim().slice(0, 2000);

  const now = new Date().toISOString();
  const payload = {
    last_click_path: path,
    last_click_campaign: campaign,
    last_click_at: now,
    updated_at: now,
  };

  const supabase = createClient(url, key);

  const { data: updatedRows, error: updateErr } = await supabase
    .from('brevo_contacts')
    .update(payload)
    .eq('email', email)
    .select('email');

  if (!updateErr && updatedRows && updatedRows.length > 0) {
    return res.status(204).end();
  }

  const { error: insertErr } = await supabase.from('brevo_contacts').insert({
    email,
    ...payload,
  });

  if (insertErr) {
    return res.status(500).end();
  }

  return res.status(204).end();
};
