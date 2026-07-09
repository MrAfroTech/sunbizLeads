// api/wallets/balance.js - Get wallet balance
// Vercel serverless function

const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

function getUserId(req) {
  return req.headers['x-user-id'] || req.body?.userId;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { data, error } = await supabase
      .from('wallets')
      .select('balance_cents, id, user_id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.status(200).json({
        success: true,
        balanceCents: 0,
        balance: 0.00
      });
    }

    return res.status(200).json({
      success: true,
      balanceCents: data.balance_cents || 0,
      balance: (data.balance_cents || 0) / 100,
      walletId: data.id
    });

  } catch (error) {
    console.error('Balance API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

