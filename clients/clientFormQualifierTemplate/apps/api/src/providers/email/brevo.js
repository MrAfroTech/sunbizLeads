import { getEnv } from '../../lib/env.js';

export async function sendBrevoEmail({ toEmail, toName, subject, html }) {
  const apiKey = getEnv('BREVO_API_KEY');
  const fromEmail = getEnv('BREVO_FROM_EMAIL');
  const fromName = getEnv('BREVO_FROM_NAME', { required: false, defaultValue: 'Fletcher Inssurance' });

  const payload = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent: html
  };

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

  return await res.json().catch(() => ({ ok: true }));
}

