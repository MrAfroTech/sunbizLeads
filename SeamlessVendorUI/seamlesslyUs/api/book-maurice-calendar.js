/**
 * Create a calendar event on Maurice Sanders' Microsoft Teams/Outlook calendar.
 * POST /api/book-maurice-calendar
 * Body: { name, email, phone, date: "YYYY-MM-DD", time: "HH:mm", timeZone?: "America/New_York" }
 * Contact info is stored in the event body (meeting notes). Sends a confirmation email to the client.
 * Uses MICROSOFT_* env; requires Calendars.ReadWrite + Mail.Send (application) for invite email.
 */

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    cors(res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    cors(res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST to book.' });
  }

  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const userEmail = process.env.MAURICE_SANDERS_EMAIL;

  if (!tenantId || !clientId || !clientSecret || !userEmail) {
    console.error('[book-maurice-calendar] Missing env: tenant, client, secret, or user email');
    cors(res);
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (e) {
    cors(res);
    return res.status(400).json({ success: false, error: 'Invalid JSON' });
  }

  const { name, email, phone, date, time, timeZone } = body;
  if (!name || !email || !phone) {
    cors(res);
    return res.status(400).json({ success: false, error: 'Name, email, and phone are required' });
  }
  if (!date || !time) {
    cors(res);
    return res.status(400).json({ success: false, error: 'Date and time are required' });
  }

  const tz = timeZone || 'UTC';
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (!year || !month || !day || hour === undefined || minute === undefined) {
    cors(res);
    return res.status(400).json({ success: false, error: 'Invalid date or time format' });
  }

  const pad = (n) => String(n).padStart(2, '0');
  const startStr = `${date}T${pad(hour)}:${pad(minute)}:00`;
  const endMinute = minute + 30;
  const endHour = hour + (endMinute >= 60 ? 1 : 0);
  const endMin = endMinute % 60;
  const endStr = `${date}T${pad(endHour)}:${pad(endMin)}:00`;

  try {
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[book-maurice-calendar] Token error', tokenRes.status, errText);
      cors(res);
      return res.status(500).json({ success: false, error: 'Could not authenticate with calendar' });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const safe = (s) => String(s).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const meetingNotesHtml = [
      '<p><strong>Booking contact (from Seamlessly calculator):</strong></p>',
      `<p>Name: ${safe(name)}</p>`,
      `<p>Email: ${safe(email)}</p>`,
      `<p>Phone: ${safe(phone)}</p>`,
    ].join('');
    const eventBody = {
      subject: `Seamless / Calculator booking – ${String(name).trim()}`,
      body: {
        contentType: 'HTML',
        content: meetingNotesHtml,
      },
      start: { dateTime: startStr, timeZone: tz },
      end: { dateTime: endStr, timeZone: tz },
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      attendees: [
        {
          emailAddress: {
            address: String(email).trim(),
            name: String(name).trim(),
          },
          type: 'required',
        },
      ],
    };

    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!graphRes.ok) {
      const errJson = await graphRes.json().catch(() => ({}));
      const errMsg = errJson.error?.message || await graphRes.text();
      console.error('[book-maurice-calendar] Graph error', graphRes.status, errMsg);
      cors(res);
      return res.status(graphRes.status >= 500 ? 500 : 400).json({
        success: false,
        error: errJson.error?.message || 'Could not create appointment',
      });
    }

    const event = await graphRes.json();

    // Send confirmation email to the client via Brevo (reliable; no Azure Mail.Send needed)
    const clientEmail = String(email).trim();
    const clientName = String(name).trim();
    const dateFmt = new Date(startStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeFmt = time.replace(/^(\d+):(\d+)$/, (_, h, m) => {
      const hour = parseInt(h, 10);
      const ampm = hour < 12 ? 'AM' : 'PM';
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    });
    const joinUrl = event.onlineMeeting?.joinUrl || event.webLink || '';
    const emailBody = [
      `<p>Hi ${safe(clientName)},</p>`,
      '<p>Your Seamlessly call is scheduled:</p>',
      `<p><strong>${dateFmt}</strong> at <strong>${timeFmt}</strong></p>`,
      joinUrl ? `<p>Join the Microsoft Teams meeting here: <a href="${String(joinUrl).replace(/"/g, '&quot;')}">${String(joinUrl).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a></p>` : '',
      '<p>You may also receive a calendar invite from Outlook with the same details.</p>',
      '<p>— Seamlessly</p>',
    ].join('');

    const brevoKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'team@ezdrink.us';
    const senderName = process.env.BREVO_SENDER_NAME || 'Seamlessly';

    if (brevoKey) {
      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': brevoKey,
          },
          body: JSON.stringify({
            sender: { email: senderEmail, name: senderName },
            to: [{ email: clientEmail, name: clientName }],
            subject: `Seamlessly call confirmed – ${dateFmt} at ${timeFmt}`,
            htmlContent: emailBody,
          }),
        });
        if (!brevoRes.ok) {
          const errText = await brevoRes.text();
          console.warn('[book-maurice-calendar] Brevo send failed (event was created):', brevoRes.status, errText);
        }
      } catch (brevoErr) {
        console.warn('[book-maurice-calendar] Brevo error (event was created):', brevoErr.message);
      }
    } else {
      // Fallback: try Microsoft Graph sendMail (requires Mail.Send permission)
      try {
        const emailBodyGraph = [
          `<p>Hi ${safe(clientName)},</p>`,
          '<p>Your Seamlessly call is scheduled:</p>',
          `<p><strong>${dateFmt}</strong> at <strong>${timeFmt}</strong></p>`,
          joinUrl ? `<p>Join the Microsoft Teams meeting here: <a href="${joinUrl.replace(/"/g, '&quot;')}">${joinUrl}</a></p>` : '',
          '<p>You may also receive a calendar invite from Outlook with the same details.</p>',
          '<p>— Seamlessly</p>',
        ].join('');
        const sendRes = await fetch(
          `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}/sendMail`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                subject: `Seamlessly call confirmed – ${dateFmt} at ${timeFmt}`,
                body: { contentType: 'HTML', content: emailBodyGraph },
                toRecipients: [
                  { emailAddress: { address: clientEmail, name: clientName } },
                ],
              },
              saveToSentItems: true,
            }),
          }
        );
        if (!sendRes.ok) {
          const errText = await sendRes.text();
          console.warn('[book-maurice-calendar] sendMail failed (event was created):', sendRes.status, errText);
        }
      } catch (sendErr) {
        console.warn('[book-maurice-calendar] sendMail error (event was created):', sendErr.message);
      }
    }

    cors(res);
    return res.status(201).json({ success: true, id: event.id });
  } catch (err) {
    console.error('[book-maurice-calendar]', err);
    cors(res);
    return res.status(500).json({ success: false, error: 'Failed to create appointment' });
  }
};
