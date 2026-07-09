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
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
  const log = (...args) => console.log('[submit-lead]', ...args);
  const logErr = (...args) => console.error('[submit-lead]', ...args);

  enableCORS(res);
  if (req.method === 'OPTIONS') {
    log('OPTIONS → 200');
    res.status(200).end();
    return;
  }

  log('1. Request:', req.method, 'expected: POST');
  if (req.method !== 'POST') {
    logErr('Unexpected method → 405');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { name, email, phone, consent_sms, consent_promo } = body;
    log('2. Body parsed:', { name: name ? '(set)' : '(missing)', email: email ? '(set)' : '(missing)', phone: phone != null, consent_sms, consent_promo });

    if (!name || !String(name).trim() || !email || !String(email).trim()) {
      logErr('3. Validation failed → 400 (name and email required)');
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = parseInt(process.env.BREVO_LIST_ID, 10) || 11;
    const templateId = parseInt(process.env.BREVO_TEMPLATE_ID, 10) || 13;
    log('3. Env:', { hasBrevoKey: !!apiKey, listId, templateId });
    if (!apiKey) {
      logErr('BREVO_API_KEY not set → 500');
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

    log('4. Brevo contact: POST v3/contacts');
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactPayload),
    });
    const contactText = await contactRes.text();
    log('5. Brevo contact response:', contactRes.status, contactRes.statusText, contactText ? contactText.slice(0, 200) : '');

    if (!contactRes.ok) {
      logErr('Brevo contact failed → 500', contactRes.status, contactText);
      return res.status(500).json({ success: false, error: 'Something went wrong' });
    }

    const emailPayload = {
      templateId: templateId,
      to: [{ email: trimmedEmail, name: trimmedName }],
    };

    log('6. Brevo email: POST v3/smtp/email, templateId:', templateId);
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });
    const emailText = await emailRes.text();
    log('7. Brevo email response:', emailRes.status, emailRes.statusText, emailText ? emailText.slice(0, 200) : '');

    if (!emailRes.ok) {
      logErr('Brevo email failed → 500', emailRes.status, emailText);
      return res.status(500).json({ success: false, error: 'Something went wrong' });
    }

    log('8. Expected: success → 200');
    return res.status(200).json({ success: true });
  } catch (err) {
    logErr('Exception:', err.message, err.stack);
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  }
};
