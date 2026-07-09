import crypto from 'node:crypto';

/**
 * Typeform signature header: `Typeform-Signature: sha256=<base64-hmac>`
 * HMAC uses the raw request body and your secret.
 */
export function verifyTypeformSignature({ secret, rawBodyBuffer, signatureHeader }) {
  if (!signatureHeader || typeof signatureHeader !== 'string') return false;
  const parts = signatureHeader.split('=');
  if (parts.length !== 2) return false;
  const algo = parts[0].trim().toLowerCase();
  const sig = parts[1].trim();
  if (algo !== 'sha256') return false;

  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBodyBuffer)
    .digest('base64');

  const a = Buffer.from(sig);
  const b = Buffer.from(digest);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

