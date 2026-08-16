// api/lounge-reservation.js — Free lounge table reservations (full event window, no time slots)
require('./load-env');
const { getSupabase } = require('./db');
const { dbTable } = require('./runtime-env');

function getTableName() {
  return dbTable('strike-after-dark');
}
const EVENT_WINDOW = '9PM – Midnight';
const VALID_TABLES = [1, 2, 3, 4, 5];
const BOOKING_THROUGH_YEAR = 2026;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '').trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 1st & 3rd Thursdays from today through end of BOOKING_THROUGH_YEAR */
function getRecurringEventDates(throughYear = BOOKING_THROUGH_YEAR) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(throughYear, 11, 31);
  end.setHours(23, 59, 59, 999);

  for (let year = today.getFullYear(); year <= throughYear; year++) {
    for (let month = 0; month < 12; month++) {
      const firstOfMonth = new Date(year, month, 1);
      const firstThursday = 1 + ((4 - firstOfMonth.getDay() + 7) % 7);
      for (const day of [firstThursday, firstThursday + 14]) {
        const date = new Date(year, month, day);
        if (date < today || date > end) continue;
        dates.push(toDateKey(date));
      }
    }
  }
  return dates;
}

function resolveEventDate(raw) {
  const allowed = getRecurringEventDates();
  const value = String(raw || '').trim();
  if (value && allowed.includes(value)) return value;
  return allowed[0] || null;
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS' || req.method?.toUpperCase() === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const supabase = getSupabase();
    const availableDates = getRecurringEventDates();

    if (req.method === 'GET') {
      const eventDate = resolveEventDate(req.query?.eventDate);
      if (!eventDate) {
        return res.status(400).json({ ok: false, error: 'No bookable event dates remain through 2026.' });
      }

      const { data, error } = await supabase
        .from(getTableName())
        .select('table_number')
        .eq('event_date', eventDate)
        .eq('status', 'reserved');

      if (error) {
        console.error('Lounge reservation GET error:', error);
        return res.status(500).json({ ok: false, error: error.message });
      }

      const reservedTables = (data || []).map((row) => Number(row.table_number));
      return res.status(200).json({
        ok: true,
        eventDate,
        availableDates,
        eventWindow: EVENT_WINDOW,
        reservedTables,
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const tableNumber = Number(body.tableNumber);
    const guestName = String(body.guestName || '').trim();
    const guestEmail = String(body.guestEmail || '').trim().toLowerCase();
    const guestPhone = normalizePhone(body.guestPhone);
    const requestedDate = String(body.eventDate || '').trim();

    if (!availableDates.includes(requestedDate)) {
      return res.status(400).json({
        ok: false,
        error: 'Choose a valid 1st or 3rd Thursday through the end of 2026.',
      });
    }

    const eventDate = requestedDate;

    if (!VALID_TABLES.includes(tableNumber)) {
      return res.status(400).json({ ok: false, error: 'Invalid table number. Choose tables 1–5.' });
    }
    if (!guestName || guestName.length < 2) {
      return res.status(400).json({ ok: false, error: 'Name is required.' });
    }
    if (!isValidEmail(guestEmail)) {
      return res.status(400).json({ ok: false, error: 'A valid email is required.' });
    }
    if (!guestPhone || guestPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ ok: false, error: 'A valid phone number is required.' });
    }

    const { data: reservedRows, error: existingError } = await supabase
      .from(getTableName())
      .select('table_number')
      .eq('event_date', eventDate)
      .eq('status', 'reserved');

    if (existingError) {
      console.error('Lounge reservation availability check error:', existingError);
      return res.status(500).json({ ok: false, error: existingError.message });
    }

    const reservedTables = (reservedRows || []).map((row) => Number(row.table_number));

    if (reservedTables.includes(tableNumber)) {
      return res.status(409).json({ ok: false, error: 'That table is already reserved.' });
    }

    const { error } = await supabase
      .from(getTableName())
      .insert({
        table_number: tableNumber,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        event_date: eventDate,
        event_window: EVENT_WINDOW,
        status: 'reserved',
        reservation_fee_cents: 0,
      });

    if (error) {
      console.error('Lounge reservation INSERT error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ ok: false, error: 'That table is already reserved.' });
      }
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(201).json({
      ok: true,
      message: 'Table reserved. Admission is still via Get Tickets / door.',
      reservation: {
        table_number: tableNumber,
        guest_name: guestName,
        guest_email: guestEmail,
        event_date: eventDate,
        event_window: EVENT_WINDOW,
        status: 'reserved',
      },
    });
  } catch (err) {
    console.error('Lounge reservation fatal error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Reservation failed' });
  }
};
