import 'dotenv/config';
import express from 'express';

import { runTypeformWebhook } from './lib/process-typeform-webhook.js';

const rawParser = express.raw({ type: '*/*', limit: '5mb' });

async function handleTypeformWebhook(req, res) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
  const signature = req.header('Typeform-Signature');
  const result = await runTypeformWebhook({
    rawBodyBuffer: rawBody,
    signatureHeader: signature
  });
  return res.status(result.status).json(result.json);
}

const app = express();

app.post('/webhooks/typeform', rawParser, handleTypeformWebhook);
app.post('/api/webhooks/typeform', rawParser, handleTypeformWebhook);

app.use((_req, res) => res.status(404).json({ ok: false, error: 'not_found' }));

const port = Number(process.env.PORT || 8787);
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[api] webhook only — POST /webhooks/typeform or /api/webhooks/typeform on port ${port}`);
  });
}

export default app;
