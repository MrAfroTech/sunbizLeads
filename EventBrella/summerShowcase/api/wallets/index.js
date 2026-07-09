// api/wallets/index.js - Wallet CRUD operations
// Vercel serverless function for wallet management

const { createClient } = require('@supabase/supabase-js');

// Get Supabase client
function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Simple auth middleware (extract user ID from headers)
function getUserId(req) {
  // In real implementation, verify JWT token or session
  // For now, get from header
  return req.headers['x-user-id'] || req.body?.userId;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = getSupabase();
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // GET /api/wallets - Get wallet by user ID
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (!data) {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance_cents: 0,
            status: 'active',
            provider: 'mock'
          })
          .select()
          .single();

        if (createError) throw createError;

        return res.status(200).json({
          success: true,
          wallet: newWallet
        });
      }

      return res.status(200).json({
        success: true,
        wallet: data
      });
    }

    // POST /api/wallets - Create wallet
    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance_cents: 0,
          status: 'active',
          provider: 'mock',
          metadata: req.body?.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        wallet: data
      });
    }

    // PUT /api/wallets - Update wallet
    if (req.method === 'PUT') {
      const updates = {};
      if (req.body.balanceCents !== undefined) {
        updates.balance_cents = req.body.balanceCents;
      }
      if (req.body.status) {
        updates.status = req.body.status;
      }
      if (req.body.metadata) {
        updates.metadata = req.body.metadata;
      }

      const { data, error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        wallet: data
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Wallet API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

