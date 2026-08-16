// api/view-ticket.js - Customer-facing ticket page with scannable QR code
const QRCode = require('qrcode');
const crypto = require('crypto');
const { getTicketByTicketId } = require('./ticket-db');

function generateChecksum(ticketId, transactionId, customerName) {
  const data = `${ticketId}-${transactionId}-${customerName || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 20);
}

function buildValidationUrl(ticket) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const ticketId = ticket.ticket_id;
  const transactionId = ticket.transaction_id;
  const customerName = ticket.customer_name || '';
  const checksum = ticket.checksum || generateChecksum(ticketId, transactionId, customerName);
  const purchaseDate = ticket.purchase_date || '';

  return `${baseUrl}/api/validate-ticket?ticketId=${encodeURIComponent(ticketId)}&transactionId=${encodeURIComponent(transactionId)}&checksum=${encodeURIComponent(checksum)}&eventName=${encodeURIComponent(ticket.event_name || 'Bosses & Bowling')}&eventDate=${encodeURIComponent(ticket.event_date || '')}&eventTime=${encodeURIComponent(ticket.event_time || '')}&customerName=${encodeURIComponent(customerName)}&customerEmail=${encodeURIComponent(ticket.customer_email || '')}&customerPhone=${encodeURIComponent(ticket.customer_phone || '')}&ticketCount=${encodeURIComponent(ticket.ticket_count || 1)}&ticketNumber=${encodeURIComponent(ticket.ticket_number || 1)}&purchaseDate=${encodeURIComponent(purchaseDate)}`;
}

function formatEventDate(eventDate) {
  if (!eventDate) return '';
  try {
    const date = new Date(eventDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return eventDate;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const ticketId = req.query.ticketId;
    if (!ticketId) {
      return res.status(400).send('Missing ticketId');
    }

    const ticket = await getTicketByTicketId(ticketId);
    if (!ticket) {
      return res.status(404).send('Ticket not found');
    }

    const validationUrl = buildValidationUrl(ticket);
    const qrCodeUrl = ticket.qr_code_url || await QRCode.toDataURL(validationUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    const eventName = ticket.event_name || 'Bosses & Bowling';
    const eventDate = formatEventDate(ticket.event_date);
    const eventTime = ticket.event_time || '';
    const customerName = ticket.customer_name || 'Guest';
    const eventVenue = ticket.event_venue || 'The Alley';
    const organizerName = 'Strike After Dark';
    const tier = ticket.tier || 'basic';
    const ticketNumber = ticket.ticket_number || 1;
    const ticketCount = ticket.ticket_count || 1;
    const statusLabel = ticket.redeemed ? 'Already Checked In' : 'Valid Ticket';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Ticket - ${eventName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
        .ticket-header h1 { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
        .ticket-header .event-date { font-size: 13px; opacity: 0.95; }
        .status {
            display: inline-block;
            margin-top: 10px;
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(255,255,255,0.2);
        }
        .ticket-body { padding: 16px; }
        .attendee-section {
            background: #f8f8f8;
            padding: 12px 16px;
            margin: 0 -16px 16px -16px;
            border-top: 0.5px solid #e5e5e5;
            border-bottom: 0.5px solid #e5e5e5;
        }
        .attendee-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
        .attendee-label { font-size: 12px; color: #8e8e93; }
        .ticket-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 0.5px solid #e5e5e5;
        }
        .ticket-label { font-size: 12px; color: #8e8e93; }
        .ticket-value { font-size: 14px; font-weight: 500; text-align: right; }
        .qr-section {
            background: #f8f8f8;
            padding: 20px;
            margin: 16px -16px;
            text-align: center;
        }
        .qr-section img {
            width: 220px;
            height: 220px;
            background: white;
            padding: 12px;
            border-radius: 8px;
        }
        .qr-help {
            margin-top: 12px;
            font-size: 13px;
            color: #555;
            line-height: 1.4;
        }
        .ticket-id {
            margin-top: 12px;
            font-family: monospace;
            font-size: 11px;
            color: #8e8e93;
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="ticket-header">
            <h1>${eventName}</h1>
            <div class="event-date">${eventDate}${eventTime ? ` • ${eventTime}` : ''}</div>
            <div class="status">${statusLabel}</div>
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
                <div class="qr-help">Show this QR code at the entrance. Staff will scan it to check you in.</div>
                <div class="ticket-id">${ticketId}</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('view-ticket error:', error);
    return res.status(500).send('Failed to load ticket');
  }
};
