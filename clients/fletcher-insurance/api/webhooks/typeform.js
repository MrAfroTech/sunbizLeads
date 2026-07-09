/**
 * Vercel serverless entry for Typeform — reads the raw POST body from the Node stream
 * so HMAC signature verification matches Typeform (Express raw() often gets an empty body on Vercel).
 *
 * Webhook URL (production): https://fletcher-insurance.vercel.app/webhooks/typeform
 * (also works: /api/webhooks/typeform — same handler)
 */
import { runTypeformWebhook } from '../../apps/api/src/lib/process-typeform-webhook.js';

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  console.log('[webhooks/typeform] request', req.method, { vercel: !!process.env.VERCEL });

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const sig = req.headers['typeform-signature'] || req.headers['Typeform-Signature'] || '';

  let buf;
  try {
    buf = await readRawBody(req);
  } catch (e) {
    console.error('[webhooks/typeform] read body failed', e);
    return res.status(400).json({ ok: false, error: 'read_body_failed' });
  }

  if (!buf || buf.length === 0) {
    console.error('[webhooks/typeform] empty body — check Vercel routing / body consumption');
    return res.status(400).json({ ok: false, error: 'empty_body' });
  }

  console.log('[webhooks/typeform] body bytes', buf.length, 'signature header', sig ? 'present' : 'MISSING');

  try {
    const result = await runTypeformWebhook({
      rawBodyBuffer: buf,
      signatureHeader: typeof sig === 'string' ? sig : String(sig)
    });
    console.log('[webhooks/typeform] response', result.status, result.json?.ok, result.json?.duplicate, result.json?._debug);
    return res.status(result.status).json(result.json);
  } catch (e) {
    console.error('[webhooks/typeform] unhandled', e);
    return res.status(500).json({ ok: false, error: e?.message || 'server_error' });
  }
}
