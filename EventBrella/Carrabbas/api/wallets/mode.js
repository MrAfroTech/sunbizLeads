// api/wallets/mode.js - Switch wallet mode (QR/NFC)
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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, GET, OPTIONS');
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

    const walletId = req.query.walletId || req.body.walletId;

    if (!walletId) {
      return res.status(400).json({ error: 'walletId required' });
    }

    // GET - Get current mode
    if (req.method === 'GET') {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('wallet_mode, id, user_id')
        .eq('id', walletId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        walletId,
        mode: wallet.wallet_mode || 'qr',
        availableModes: ['qr', 'nfc'],
        nfcEnabled: false, // Phase 2
        note: wallet.wallet_mode === 'nfc' ? 'NFC mode requires Marqeta integration (Phase 2)' : null
      });
    }

    // PATCH - Update mode
    if (req.method === 'PATCH') {
      const { mode } = req.body;

      if (!mode || (mode !== 'qr' && mode !== 'nfc')) {
        return res.status(400).json({ error: 'mode must be "qr" or "nfc"' });
      }

      // Check if NFC is enabled (Phase 2)
      if (mode === 'nfc') {
        // In Phase 2, check if Marqeta is configured
        // For now, return error
        return res.status(400).json({
          error: 'NFC mode not yet available',
          message: 'NFC mode requires Marqeta integration. Coming in Phase 2.',
          availableMode: 'qr'
        });
      }

      // Update wallet mode
      const { data: wallet, error } = await supabase
        .from('wallets')
        .update({ wallet_mode: mode })
        .eq('id', walletId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        walletId,
        mode: wallet.wallet_mode,
        message: `Wallet mode updated to ${mode.toUpperCase()}`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Mode API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

