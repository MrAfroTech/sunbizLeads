/**
 * POST /api/book-revenue-fit-session
 * Logs Revenue Fit Session intent, returns Calendly redirect URL (no Calendly API).
 * Body: { name, email, phone, attribution }
 */

const CALENDLY_BOOKING_URL =
  process.env.REVENUE_FIT_CALENDLY_URL ||
  'https://calendly.com/staying-ahead-of-the-game/seamless-chat-clone';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readSupabaseEnv() {
  const url =
    process.env.SUPABASE_SCAN_AND_SCALE_URL ||
    process.env.VITE_SUPABASE_URL_SALES_MASTERY ||
    process.env.REACT_APP_SUPABASE_URL_SALES_MASTERY;
  const key =
    process.env.SUPABASE_SCAN_AND_SCALE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY_SALES_MASTERY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY;
  return { url, key };
}

function buildCalendlyRedirectUrl({ name, email, attribution }) {
  const params = new URLSearchParams();
  if (name) params.set('name', String(name).trim());
  if (email) params.set('email', String(email).trim().toLowerCase());

  const attr = attribution && typeof attribution === 'object' ? attribution : {};
  if (attr.campaign) params.set('campaign', String(attr.campaign));
  if (attr.contactId) params.set('contactId', String(attr.contactId));
  if (attr.calculatorType) params.set('calculator', String(attr.calculatorType));
  if (attr.variant) params.set('variant', String(attr.variant));

  const qs = params.toString();
  return `${CALENDLY_BOOKING_URL}${qs ? `?${qs}` : ''}`;
}

async function recordBookingEvent(supabaseUrl, supabaseKey, payload) {
  if (!supabaseUrl || !supabaseKey) return false;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ingest-lead-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('[book-revenue-fit-session] ingest event failed:', err.message);
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    cors(res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    cors(res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    cors(res);
    return res.status(400).json({ success: false, error: 'Invalid JSON' });
  }

  const { name, email, phone, attribution } = body;
  const trimmedName = name ? String(name).trim() : '';
  const trimmedEmail = email ? String(email).trim().toLowerCase() : '';
  const trimmedPhone = phone ? String(phone).trim() : '';
  const attr = attribution && typeof attribution === 'object' ? attribution : {};

  const redirectUrl = buildCalendlyRedirectUrl({
    name: trimmedName,
    email: trimmedEmail,
    attribution: attr,
  });

  const timestamp = new Date().toISOString();
  const { url: supabaseUrl, key: supabaseKey } = readSupabaseEnv();

  const eventMeta = {
    event_type: 'revenue_fit_session_requested',
    status: 'queued',
    timestamp,
    email: trimmedEmail || attr.email || undefined,
    campaign: attr.campaign,
    contactId: attr.contactId,
    calculatorType: attr.calculatorType,
    variant: attr.variant,
    name: trimmedName || undefined,
    phone: trimmedPhone || undefined,
  };

  void recordBookingEvent(supabaseUrl, supabaseKey, {
    event_name: 'revenue_fit_session_requested',
    engagement_type: 'submit',
    source: 'revenue_fit_session',
    email: trimmedEmail || undefined,
    meta: eventMeta,
  });

  cors(res);
  return res.status(200).json({
    success: true,
    status: 'queued',
    redirectUrl,
  });
};
