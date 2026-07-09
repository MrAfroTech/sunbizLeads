function firstNameFromName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0] || 'there';
}

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function generateSportsHeyyouEmail({
  name = 'there',
  venueName = '',
  leftOnTable = 0,
  pdfUrl = '',
}) {
  const firstName = firstNameFromName(name);
  const venueLine = venueName
    ? ` at <strong>${venueName}</strong>`
    : '';
  const lossLine =
    leftOnTable > 0
      ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#444;">
          Based on your calculator run, you left an estimated <strong>${formatMoney(leftOnTable)}</strong> on the table last game${venueLine}. The attached guide shows where venues like yours recover that revenue fastest.
        </p>`
      : `<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#444;">
          The attached guide breaks down the nine operational shifts that move concession revenue fastest at stadium-scale venues.
        </p>`;
  const downloadLine = pdfUrl
    ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#666;">
          PDF not showing? <a href="${pdfUrl}" style="color:#b8860b;font-weight:700;">Download it here</a>.
        </p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your venue revenue guide</title>
</head>
<body style="margin:0;padding:0;background:#f5ecd7;font-family:Arial,sans-serif;color:#1a1208;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5ecd7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(26,18,8,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1208 0%,#2d2216 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#f5ecd7;font-size:22px;line-height:1.3;">Your guide is attached</h1>
              <p style="margin:10px 0 0;color:#c8a44a;font-size:14px;">9 Things · Seamlessly Sports</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                Thanks for running your revenue numbers. As promised, here is <strong>Hey You — 9 Things</strong> (PDF attached) — built for venue operators who want fans spending more without longer lines.
              </p>
              ${lossLine}
              ${downloadLine}
              <p style="margin:0;font-size:14px;line-height:1.6;color:#666;">
                — The Seamlessly team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateSportsHeyyouPlainText({
  name = 'there',
  venueName = '',
  leftOnTable = 0,
  pdfUrl = '',
}) {
  const firstName = firstNameFromName(name);
  const lines = [
    `Hi ${firstName},`,
    '',
    'Thanks for running your revenue numbers. As promised, here is Hey You — 9 Things (PDF attached).',
  ];

  if (leftOnTable > 0) {
    lines.push(
      '',
      `Based on your calculator run, you left an estimated ${formatMoney(leftOnTable)} on the table last game${
        venueName ? ` at ${venueName}` : ''
      }.`
    );
  }

  if (pdfUrl) {
    lines.push('', `Download: ${pdfUrl}`);
  }

  lines.push('', '— The Seamlessly team');
  return lines.join('\n');
}

module.exports = {
  generateSportsHeyyouEmail,
  generateSportsHeyyouPlainText,
};
