// Append-only scan_and_scale_site_events; optional last_click_* on scan_and_scale_click_events.
const { createClient } = require('@supabase/supabase-js');

function readSupabaseEnv() {
  const url =
    process.env.SUPABASE_SCAN_AND_SCALE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SCAN_AND_SCALE_ANON_KEY ||
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

function looksLikeEmail(s) {
  if (!s || typeof s !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function optionalText(value, maxLen) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim().slice(0, maxLen);
}

function resolveEventEmail(body) {
  const fromEmail = body.email != null ? normalizeEmail(body.email) : '';
  if (fromEmail && looksLikeEmail(fromEmail)) return fromEmail;
  const fromContact = body.contact != null ? normalizeEmail(body.contact) : '';
  if (fromContact && looksLikeEmail(fromContact)) return fromContact;
  return null;
}

module.exports = async function logSiteEvent(req, res) {
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
  const eventType = body.event_type;
  if (eventType == null || String(eventType).trim() === '') {
    return res.status(400).end();
  }

  const type = String(eventType).trim();

  if (type === 'phone_capture') {
    const email = normalizeEmail(body.email);
    const phone = String(body.phone || '').trim().slice(0, 50);
    const name =
      body.name == null || String(body.name).trim() === ''
        ? null
        : String(body.name).trim().slice(0, 500);

    if (!email || !looksLikeEmail(email) || !phone) {
      return res.status(400).end();
    }

    const supabase = createClient(url, key);
    const now = new Date().toISOString();
    const pagePath = String(body.page_path || '').trim().slice(0, 2000);
    const campaign =
      body.campaign == null || String(body.campaign).trim() === ''
        ? null
        : String(body.campaign).trim().slice(0, 500);

    const payload = {
      name,
      phone,
      last_click_path: pagePath,
      last_click_campaign: campaign,
      last_click_at: now,
      updated_at: now,
    };

    try {
      const { data: updatedRows } = await supabase
        .from('scan_and_scale_click_events')
        .update(payload)
        .eq('email', email)
        .select('email');

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertErr } = await supabase
          .from('scan_and_scale_click_events')
          .insert({ email, ...payload });

        if (insertErr) {
          return res.status(500).end();
        }
      }
    } catch {
      return res.status(500).end();
    }

    return res.status(204).end();
  }

  const eventEmail = resolveEventEmail(body);

  const row = {
    session_id: String(body.session_id || '').trim().slice(0, 128),
    event_type: String(eventType).trim(),
    page_path: String(body.page_path || '').trim().slice(0, 2000),
    contact_id: optionalText(body.contact_id, 128),
    email: eventEmail ? eventEmail.slice(0, 500) : null,
    first_name: optionalText(body.first_name, 500),
    last_name: optionalText(body.last_name, 500),
    campaign: optionalText(body.campaign, 500),
    contact: eventEmail ? eventEmail.slice(0, 500) : optionalText(body.contact, 500),
    element_label:
      body.element_label == null || String(body.element_label).trim() === ''
        ? null
        : String(body.element_label).trim().slice(0, 500),
    target_href:
      body.target_href == null || String(body.target_href).trim() === ''
        ? null
        : String(body.target_href).trim().slice(0, 2000),
    link_text:
      body.link_text == null || String(body.link_text).trim() === ''
        ? null
        : String(body.link_text).trim().slice(0, 500),
    referrer:
      body.referrer == null || String(body.referrer).trim() === ''
        ? null
        : String(body.referrer).trim().slice(0, 2000),
    user_agent:
      body.user_agent == null || String(body.user_agent).trim() === ''
        ? null
        : String(body.user_agent).trim().slice(0, 500),
  };

  const supabase = createClient(url, key);

  const { error: insertErr } = await supabase
    .from('scan_and_scale_site_events')
    .insert(row);

  if (insertErr) {
    return res.status(500).end();
  }

  if (eventEmail) {
    const now = new Date().toISOString();
    const payload = {
      last_click_path: row.page_path,
      last_click_campaign: row.campaign,
      last_click_at: now,
      updated_at: now,
    };

    try {
      const { data: updatedRows } = await supabase
        .from('scan_and_scale_click_events')
        .update(payload)
        .eq('email', eventEmail)
        .select('email');

      if (!updatedRows || updatedRows.length === 0) {
        await supabase.from('scan_and_scale_click_events').insert({
          email: eventEmail,
          ...payload,
        });
      }
    } catch {
      // Best-effort contact upsert; site event already stored.
    }
  }

  return res.status(204).end();
};
