#!/usr/bin/env node
/**
 * Creates the four Scan & Scale Brevo SMTP templates via POST /v3/smtp/templates
 * and writes returned numeric IDs into config/brevo-templates.json.
 *
 * Required env:
 *   BREVO_API_KEY
 *
 * Optional:
 *   SCAN_SCALE_EMAIL_TEMPLATE_DIR — absolute folder containing scan_scale_email_00{N}.html
 *     Defaults to ../../../../emailSequences/magicBandsSequence relative to this script
 *     (repo: salesMastery/emailSequences/magicBandsSequence).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function requireEnv(name) {
  const v = process.env[name]?.trim?.();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

async function fetchJson(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined
      ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
      : {}),
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${url} → HTTP ${res.status}: ${txt}`);
  }
  return txt ? JSON.parse(txt) : null;
}

async function getDefaultSender(apiKey) {
  const data = await fetchJson('https://api.brevo.com/v3/senders', {
    headers: { 'api-key': apiKey },
  });
  const list = Array.isArray(data.senders)
    ? data.senders.filter((s) => s?.email?.trim?.())
    : [];
  if (!list.length) throw new Error('Brevo /senders returned no usable senders');
  const first = list.find((s) => s.active !== false) ?? list[0];
  return {
    email: String(first.email).trim(),
    ...(first.name?.trim?.() ? { name: String(first.name).trim() } : {}),
  };
}

async function createTemplate(apiKey, sender, { name, subject, htmlPath }) {
  const htmlContent = readFileSync(htmlPath, 'utf8');
  const payload = {
    templateName: name,
    subject,
    htmlContent,
    isActive: true,
    sender,
  };

  const data = await fetchJson('https://api.brevo.com/v3/smtp/templates', {
    method: 'POST',
    headers: { 'api-key': apiKey },
    body: payload,
  });

  const id =
    typeof data?.id === 'number'
      ? data.id
      : typeof data?.id === 'string'
        ? Number(data.id)
        : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`Brevo returned unexpected payload for "${name}": ${JSON.stringify(data)}`);
  }
  return id;
}

const SPECS = [
  {
    file: 'magic_bands_email_001.html',
    templateName: 'MagicBands — Email 1: The Mirror',
    subject: 'Getting served feels like work — and your guests are noticing.',
    key: 'email_1_template_id',
  },
  {
    file: 'magic_bands_email_002.html',
    templateName: 'MagicBands — Email 2: The Proof',
    subject: '42% higher transaction size. 48% repeat guest behavior. When friction disappears.',
    key: 'email_2_template_id',
  },
  {
    file: 'magic_bands_email_003.html',
    templateName: 'MagicBands — Email 3: The Cost of Waiting',
    subject: 'Every guest who abandons the bar line is revenue you never get back.',
    key: 'email_3_template_id',
  },
  {
    file: 'magic_bands_email_004.html',
    templateName: 'MagicBands — Email 4: The Decision',
    subject: '30-minute Revenue Fit Session — map your MagicBands pilot before your next event.',
    key: 'email_4_template_id',
  },
];

async function main() {
  const apiKey = requireEnv('BREVO_API_KEY');
  const tplRoot =
    process.env.SCAN_SCALE_EMAIL_TEMPLATE_DIR?.trim?.() ??
    path.resolve(__dirname, '../../../../emailSequences/magicBandsSequence');

  const sender = await getDefaultSender(apiKey);
  const ids = {};

  for (const spec of SPECS) {
    const abs = path.join(tplRoot, spec.file);
    const id = await createTemplate(apiKey, sender, {
      name: spec.templateName,
      subject: spec.subject,
      htmlPath: abs,
    });
    ids[spec.key] = id;
    console.warn(`Created template "${spec.templateName}" → ${id}`);
  }

  const outPath = path.resolve(__dirname, '../config/brevo-templates.json');
  writeFileSync(
    outPath,
    `${JSON.stringify(
      {
        email_1_template_id: ids.email_1_template_id,
        email_2_template_id: ids.email_2_template_id,
        email_3_template_id: ids.email_3_template_id,
        email_4_template_id: ids.email_4_template_id,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  console.warn(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
