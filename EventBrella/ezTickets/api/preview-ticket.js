// api/preview-ticket.js - Preview Ticket with QR Code
const QRCode = require('qrcode');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed. Use GET to preview ticket.'
    });
  }

  try {
    // Sample ticket data
    const transactionId = 'TXN_PREVIEW_' + Date.now();
    const ticketCount = 4; // Total tickets purchased
    const ticketNumber = 3; // This is ticket 3 of 4
    const ticketId = `TKT_${transactionId}_${ticketNumber}`;
    const customerName = 'John Doe';
    const eventDate = '2026-01-03';
    const eventName = 'Cassava Harvest';
    // Determine event time: Farm Tour = 9-11 AM, Harvests = 8-10 AM
    const eventTime = eventName && eventName.includes('Farm Tour') ? '9:00 AM - 11:00 AM EST' : '8:00 AM - 10:00 AM EST';
    const eventVenue = process.env.CLIENT_VENUE_NAME || 'CLIENT_VENUE_NAME';
    const organizerName = process.env.ORGANIZER_NAME || 'Organizer Name';
    const tier = 'basic';
    const purchaseDate = new Date().toISOString();

    // Generate checksum
    function generateChecksum(ticketId, transactionId, customerName) {
      const data = `${ticketId}-${transactionId}-${customerName}`;
      return crypto.createHash('sha256').update(data).digest('hex').substring(0, 20);
    }

    // Create QR code data
    const qrData = {
      ticketId: ticketId,
      transactionId: transactionId,
      eventName: eventName,
      eventDate: eventDate,
      eventTime: eventTime,
      eventVenue: eventVenue,
      organizerName: organizerName,
      tier: tier,
      purchaseDate: purchaseDate,
      customerName: customerName,
      ticketNumber: ticketNumber,
      ticketCount: ticketCount,
      checksum: generateChecksum(ticketId, transactionId, customerName),
      version: '1.0',
      source: process.env.CLIENT_SOURCE_ID || 'eventbrella_ticketing'
    };

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    // Return HTML preview page - Wallet Style
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Preview - ${eventName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #000;
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .ticket-container {
            max-width: 375px;
            width: 100%;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .ticket-header {
            background: linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%);
            color: white;
            padding: 20px 16px;
        }
        .ticket-header h1 {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 4px;
            line-height: 1.2;
        }
        .ticket-header .event-date {
            font-size: 13px;
            opacity: 0.95;
            font-weight: 400;
        }
        .ticket-body {
            padding: 16px;
        }
        .ticket-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 0.5px solid #e5e5e5;
        }
        .ticket-row:last-child {
            border-bottom: none;
        }
        .ticket-label {
            font-size: 12px;
            color: #8e8e93;
            font-weight: 400;
        }
        .ticket-value {
            font-size: 14px;
            color: #000;
            font-weight: 500;
            text-align: right;
        }
        .qr-section {
            background: #f8f8f8;
            padding: 20px;
            margin: 16px -16px;
            text-align: center;
        }
        .qr-section img {
            width: 200px;
            height: 200px;
            background: white;
            padding: 12px;
            border-radius: 8px;
            display: block;
            margin: 0 auto;
        }
        .ticket-id {
            margin-top: 12px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 11px;
            color: #8e8e93;
            letter-spacing: 0.3px;
        }
        .attendee-section {
            background: #f8f8f8;
            padding: 12px 16px;
            margin: 0 -16px 16px -16px;
            border-top: 0.5px solid #e5e5e5;
            border-bottom: 0.5px solid #e5e5e5;
        }
        .attendee-name {
            font-size: 16px;
            font-weight: 600;
            color: #000;
            margin-bottom: 4px;
        }
        .attendee-label {
            font-size: 12px;
            color: #8e8e93;
        }
        .note {
            background: #fff3cd;
            padding: 10px 12px;
            margin-top: 16px;
            border-radius: 8px;
            font-size: 11px;
            color: #856404;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="ticket-header">
            <h1>${eventName}</h1>
            <div class="event-date">${eventDate} • ${eventTime}</div>
        </div>
        
        <div class="ticket-body">
            <div class="attendee-section">
                <div class="attendee-name">${customerName}</div>
                <div class="attendee-label">Attendee</div>
            </div>

            <div class="ticket-row">
                <span class="ticket-label">Venue</span>
                <span class="ticket-value">${eventVenue}</span>
            </div>
            <div class="ticket-row">
                <span class="ticket-label">Organizer</span>
                <span class="ticket-value">${organizerName}</span>
            </div>
            <div class="ticket-row">
                <span class="ticket-label">Tier</span>
                <span class="ticket-value">${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
            </div>
            <div class="ticket-row">
                <span class="ticket-label">Ticket</span>
                <span class="ticket-value">${ticketNumber} of ${ticketCount}</span>
            </div>

            <div class="qr-section">
                <img src="${qrCodeUrl}" alt="Ticket QR Code" />
                <div class="ticket-id">${ticketId}</div>
            </div>

            <div class="note">
                <strong>Preview:</strong> Sample ticket. Actual tickets sent via email after payment.
            </div>
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('❌ Preview ticket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate ticket preview',
      error: error.message
    });
  }
};

