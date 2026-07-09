/**
 * Adds a contact to the Brevo list for the Book Preview funnel.
 *
 * Endpoint (via wrapper): POST /api/addToBrevo
 * Body: { email: string }
 */

function enableCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  return req.body || {};
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

module.exports = async function handler(req, res) {
  enableCORS(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ success: false, error: 'A valid email is required' });
      return;
    }

    // Brevo config (detected from .env variable name)
    const apiKey = process.env.BREVO_API_KEY;
    const listIds = [47];

    if (!apiKey) {
      console.error('addToBrevo: BREVO_API_KEY not set');
      res.status(500).json({ success: false, error: 'BREVO_API_KEY not set' });
      return;
    }

    const brevoPayload = {
      email,
      listIds,
      updateEnabled: true,
    };

    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text().catch(function () { return ''; });
      console.error('addToBrevo: Brevo API error', brevoRes.status, errText);
      res.status(500).json({
        success: false,
        error: errText || 'Brevo API error',
        brevoStatus: brevoRes.status,
      });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('addToBrevo error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
};

