// api/partnership-inquiry.js
// POST partnership inquiries into Supabase (partnership_inquiries table).

const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase configuration');
  return createClient(supabaseUrl, supabaseKey);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      restaurant_name,
      contact_name,
      email,
      phone,
      address,
      establishment_type,
      current_traffic,
      message
    } = body;

    if (!restaurant_name || !contact_name || !email || !phone || !address || !establishment_type || !current_traffic) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['restaurant_name', 'contact_name', 'email', 'phone', 'address', 'establishment_type', 'current_traffic']
      });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('partnership_inquiries')
      .insert({
        restaurant_name: String(restaurant_name).trim(),
        contact_name: String(contact_name).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        address: String(address).trim(),
        establishment_type: String(establishment_type),
        current_traffic: String(current_traffic),
        message: message != null ? String(message).trim() : null,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('partnership-inquiry insert error:', error);
      return res.status(500).json({ error: 'Failed to save inquiry' });
    }

    return res.status(201).json({ ok: true, id: data?.id });
  } catch (e) {
    console.error('partnership-inquiry error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};
