function formatMoney(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatMoneyDec(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

function generateMagicBandsResultsEmail({
  name = 'there',
  amount = 0,
  lostPerFan = 0,
  fans = 0,
  parkingLoss = 0,
  blueprintUrl,
}) {
  const parkingRow =
    parkingLoss > 0
      ? `<tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;">Parking friction (70% × fee × attendance)</td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#1a1208;">${formatMoney(parkingLoss)}</td>
        </tr>`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your MagicBands Guest Flow Results</title>
</head>
<body style="margin:0;padding:0;background:#f5ecd7;font-family:Arial,sans-serif;color:#1a1208;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5ecd7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(26,18,8,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1208 0%,#2d2216 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#f5ecd7;font-size:22px;line-height:1.3;">Your guest flow results</h1>
              <p style="margin:10px 0 0;color:#c8a44a;font-size:14px;">MagicBands · Seamlessly</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Hi ${name},</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                Here are the numbers from your calculator — real revenue your guests wanted to spend, but friction at the door or service point took off the table.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;">Left on the table per event</td>
                  <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#1a1208;font-size:18px;">${formatMoney(amount)}</td>
                </tr>
                ${parkingRow}
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;">Lost per affected guest</td>
                  <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#1a1208;">${formatMoneyDec(lostPerFan)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;color:#666;">Guests who didn't complete a purchase</td>
                  <td style="padding:12px 0;text-align:right;font-weight:700;color:#1a1208;">${Math.round(fans).toLocaleString('en-US')}</td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#444;">
                MagicBands start by fixing flow at the door and parking. POS integration fixes flow at the bar.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:linear-gradient(135deg,#c8a44a 0%,#e8c96a 100%);border-radius:100px;">
                    <a href="${blueprintUrl}" style="display:inline-block;padding:14px 28px;color:#1a1208;font-weight:700;text-decoration:none;font-size:15px;">
                      Get the Standard MagicBands Blueprint
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#faf6ee;text-align:center;font-size:12px;color:#888;">
              Seamlessly · Bringing hospitality into the 21st century
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateMagicBandsResultsPlainText({
  name = 'there',
  amount = 0,
  lostPerFan = 0,
  fans = 0,
  parkingLoss = 0,
  blueprintUrl,
}) {
  const parkingLine =
    parkingLoss > 0 ? `\nParking friction: ${formatMoney(parkingLoss)}` : '';

  return `Hi ${name},

Here are your MagicBands guest flow calculator results:

Left on the table per event: ${formatMoney(amount)}${parkingLine}
Lost per affected guest: ${formatMoneyDec(lostPerFan)}
Guests who didn't complete a purchase: ${Math.round(fans).toLocaleString('en-US')}

MagicBands start by fixing flow at the door and parking. POS integration fixes flow at the bar.

Get the standard MagicBands blueprint: ${blueprintUrl}

— Seamlessly`;
}

module.exports = {
  generateMagicBandsResultsEmail,
  generateMagicBandsResultsPlainText,
};
