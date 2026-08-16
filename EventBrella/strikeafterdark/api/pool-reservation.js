// api/pool-reservation.js — Pool table reservations (1-hour blocks, 9PM–Midnight)
require('./load-env');
const { getSupabase } = require('./db');
const { dbTable } = require('./runtime-env');

function getTableName() {
  return dbTable('strike-after-dark-pool');
}
const EVENT_DATE = process.env.EVENT_DATE || '2026-08-06';
const VALID_TABLES = [1, 2, 3, 4, 5, 6, 7, 8];
const VALID_SLOTS = ['9pm-10pm', '10pm-11pm', '11pm-midnight'];
const SLOT_LABELS = {
  '9pm-10pm': '9PM – 10PM',
  '10pm-11pm': '10PM – 11PM',
  '11pm-midnight': '11PM – Midnight',
};

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

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS' || req.method?.toUpperCase() === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from(getTableName())
        .select('table_number, time_slot')
        .eq('event_date', EVENT_DATE)
        .eq('status', 'reserved');

      if (error) {
        console.error('Pool reservation GET error:', error);
        return res.status(500).json({ ok: false, error: error.message });
      }

      return res.status(200).json({
        ok: true,
        eventDate: EVENT_DATE,
        reservations: data || [],
        slots: VALID_SLOTS.map((id) => ({ id, label: SLOT_LABELS[id] })),
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const tableNumber = Number(body.tableNumber);
    const timeSlot = String(body.timeSlot || '').trim();
    const guestName = String(body.guestName || '').trim();
    const guestEmail = String(body.guestEmail || '').trim().toLowerCase();
    const guestPhone = normalizePhone(body.guestPhone);

    if (!VALID_TABLES.includes(tableNumber)) {
      return res.status(400).json({ ok: false, error: 'Invalid pool table. Choose tables 1–8.' });
    }
    if (!VALID_SLOTS.includes(timeSlot)) {
      return res.status(400).json({ ok: false, error: 'Invalid time slot. Choose a 1-hour block.' });
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
      .select('table_number, time_slot')
      .eq('event_date', EVENT_DATE)
      .eq('status', 'reserved');

    if (existingError) {
      console.error('Pool reservation availability check error:', existingError);
      return res.status(500).json({ ok: false, error: existingError.message });
    }

    const taken = (reservedRows || []).some(
      (row) => Number(row.table_number) === tableNumber && row.time_slot === timeSlot
    );
    if (taken) {
      return res.status(409).json({ ok: false, error: 'That pool table hour is already reserved.' });
    }

    const { error } = await supabase
      .from(getTableName())
      .insert({
        table_number: tableNumber,
        time_slot: timeSlot,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        event_date: EVENT_DATE,
        status: 'reserved',
        reservation_fee_cents: 0,
      });

    if (error) {
      console.error('Pool reservation INSERT error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ ok: false, error: 'That pool table hour is already reserved.' });
      }
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(201).json({
      ok: true,
      message: 'Pool table reserved.',
      reservation: {
        table_number: tableNumber,
        time_slot: timeSlot,
        time_slot_label: SLOT_LABELS[timeSlot],
        guest_name: guestName,
        guest_email: guestEmail,
        event_date: EVENT_DATE,
        status: 'reserved',
      },
    });
  } catch (err) {
    console.error('Pool reservation fatal error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Reservation failed' });
  }
};
