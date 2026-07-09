/**
 * Event Planner Playbook — Form to Brevo CRM
 * POST /api/submit-lead
 * Body: { name, email, phone?, consent_sms, consent_promo }
 * Loads env from landingPages/.env when present (local dev); Vercel uses project env.
 */

const path = require('path');
const fs = require('fs');

(function loadLandingPagesEnv() {
  try {
    const envPath = path.resolve(process.cwd(), 'landingPages', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(function (line) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eq = trimmed.indexOf('=');
          if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
            if (key && process.env[key] === undefined) process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    // ignore; use existing process.env (e.g. Vercel)
  }
})();

function enableCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseName(fullName) {
  const trimmed = String(fullName || '').trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

module.exports = async function handler(req, res) {
  enableCORS(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { name, email, phone, consent_sms, consent_promo } = body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = parseInt(process.env.BREVO_LIST_ID, 10) || 11;
    const templateId = parseInt(process.env.BREVO_TEMPLATE_ID, 10) || 13;

    if (!apiKey) {
      console.error('submit-lead: BREVO_API_KEY not set');
      return res.status(500).json({ success: false, error: 'Something went wrong' });
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedPhone = phone != null ? String(phone).trim() : '';
    const { first: firstName, last: lastName } = parseName(trimmedName);

    const contactPayload = {
      email: trimmedEmail,
      attributes: {
        FIRSTNAME: firstName,
        LASTNAME: lastName,
        PHONE: trimmedPhone,
        SMS_CONSENT: !!consent_sms,
        PROMO_CONSENT: !!consent_promo,
      },
      listIds: [listId],
      updateEnabled: true,
    };

    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactPayload),
    });

    if (!contactRes.ok) {
      const errText = await contactRes.text();
      console.error('Brevo contact error:', contactRes.status, errText);
      return res.status(500).json({ success: false, error: 'Something went wrong' });
    }

    const emailPayload = {
      templateId: templateId,
      to: [{ email: trimmedEmail, name: trimmedName }],
    };

    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Brevo email error:', emailRes.status, errText);
      return res.status(500).json({ success: false, error: 'Something went wrong' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit-lead error:', err);
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  }
};
