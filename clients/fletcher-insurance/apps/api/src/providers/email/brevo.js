import { getEnv } from '../../lib/env.js';

/**
 * @param {object} opts
 * @param {string} opts.toEmail
 * @param {string} [opts.toName]
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {{ email: string; name?: string }[]} [opts.cc] Brevo CC list (optional)
 */
export async function sendBrevoEmail({ toEmail, toName, subject, html, cc }) {
  const apiKey = getEnv('BREVO_API_KEY');
  const fromEmail = getEnv('BREVO_FROM_EMAIL');
  const fromName = getEnv('BREVO_FROM_NAME', { required: false, defaultValue: 'Fletcher Insurance' });

  const payload = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: toEmail, name: toName || 'Sales' }],
    subject,
    htmlContent: html
  };

  if (Array.isArray(cc) && cc.length > 0) {
    payload.cc = cc.map((c) => ({ email: c.email, name: c.name || '' }));
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Brevo send failed (${res.status}): ${text}`);
  }

  const body = await res.json().catch(() => ({}));
  const messageId = body?.messageId ?? body?.message_id;
  console.log('[brevo] API accepted email', messageId ? { messageId } : body);
  return { ...body, messageId: messageId ?? body?.messageId };
}

