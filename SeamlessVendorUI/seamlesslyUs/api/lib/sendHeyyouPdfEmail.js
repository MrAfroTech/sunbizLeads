const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const {
  generateSportsHeyyouEmail,
  generateSportsHeyyouPlainText,
} = require('./heyyouEmailTemplate');

function resolvePdfPath(pdfFilename) {
  const candidates = [
    path.join(process.cwd(), 'build', 'downloads', pdfFilename),
    path.join(process.cwd(), 'public', 'downloads', pdfFilename),
    path.join(__dirname, '..', '..', 'build', 'downloads', pdfFilename),
    path.join(__dirname, '..', '..', 'public', 'downloads', pdfFilename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function chunkBase64(base64) {
  return base64.match(/.{1,76}/g)?.join('\r\n') || base64;
}

function buildRawMimeMessage({ from, to, subject, html, text, attachmentBase64, attachmentFilename }) {
  const mixedBoundary = `mixed_${Date.now()}`;
  const altBoundary = `alt_${Date.now()}`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    '',
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text,
    '',
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${altBoundary}--`,
    '',
    `--${mixedBoundary}`,
    `Content-Type: application/pdf; name="${attachmentFilename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${attachmentFilename}"`,
    '',
    chunkBase64(attachmentBase64),
    '',
    `--${mixedBoundary}--`,
    '',
  ].join('\r\n');
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{
 *   pdfFilename: string,
 *   subject?: string,
 *   successMessage: string,
 *   logTag: string,
 *   emailOptions?: Record<string, string>,
 * }} config
 */
async function sendHeyyouPdfEmail(req, res, config) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-vercel-protection-bypass'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const { name, email, venueName, leftOnTable, siteUrl } = req.body || {};
    const recipient = String(email || '').trim().toLowerCase();

    if (!recipient || !recipient.includes('@')) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    const pdfPath = resolvePdfPath(config.pdfFilename);
    if (!pdfPath) {
      res.status(500).json({
        success: false,
        message: `Lead magnet PDF is not available on the server (${config.pdfFilename}).`,
      });
      return;
    }

    const pdfBase64 = fs.readFileSync(pdfPath).toString('base64');
    const baseUrl = String(siteUrl || process.env.SITE_URL || 'https://www.seamlessly.us').replace(/\/$/, '');
    const pdfUrl = `${baseUrl}/downloads/${config.pdfFilename}`;

    const templateData = {
      name: (name || 'there').trim(),
      venueName: (venueName || '').trim(),
      leftOnTable: Number(leftOnTable) || 0,
      pdfUrl,
      ...(config.emailOptions || {}),
    };

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      res.status(500).json({
        success: false,
        message: 'Email service is not configured (missing AWS credentials).',
      });
      return;
    }

    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-2',
    });

    const ses = new AWS.SES({ apiVersion: '2010-12-01' });
    const senderEmail = process.env.EMAIL_FROM || 'Seamlessly <team@seamlessly.us>';
    const subject = config.subject || 'Your guide: 9 things every venue operator should know';

    const rawMessage = buildRawMimeMessage({
      from: senderEmail,
      to: recipient,
      subject,
      html: generateSportsHeyyouEmail(templateData),
      text: generateSportsHeyyouPlainText(templateData),
      attachmentBase64: pdfBase64,
      attachmentFilename: config.pdfFilename,
    });

    const result = await ses
      .sendRawEmail({
        Source: senderEmail,
        Destinations: [recipient],
        RawMessage: { Data: Buffer.from(rawMessage) },
      })
      .promise();

    res.status(200).json({
      success: true,
      message: config.successMessage,
      id: result.MessageId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[${config.logTag}]`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email',
    });
  }
}

module.exports = {
  sendHeyyouPdfEmail,
  resolvePdfPath,
};
