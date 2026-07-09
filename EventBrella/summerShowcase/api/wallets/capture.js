// api/wallets/capture.js - Capture authorized payment
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { authorizationId, metadata } = req.body;

    if (!authorizationId) {
      return res.status(400).json({ error: 'authorizationId required' });
    }

    // Get authorization transaction
    const { data: authTx, error: authError } = await supabase
      .from('wallet_transactions')
      .select('*, wallets(*)')
      .eq('authorization_id', authorizationId)
      .eq('user_id', userId)
      .eq('transaction_type', 'authorize')
      .eq('status', 'pending')
      .single();

    if (authError) {
      return res.status(404).json({ error: 'Authorization not found or already processed' });
    }

    // Check expiration
    const expiresAt = new Date(authTx.metadata?.expiresAt || authTx.created_at);
    if (new Date() > new Date(expiresAt.getTime() + 15 * 60000)) {
      return res.status(400).json({ error: 'Authorization has expired' });
    }

    const wallet = authTx.wallets;
    const amountCents = authTx.amount_cents;

    // Deduct from balance
    const newBalance = (wallet.balance_cents || 0) - amountCents;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance_cents: newBalance })
      .eq('id', wallet.id);

    if (updateError) throw updateError;

    // Update authorization transaction
    const captureId = `capt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error: updateTxError } = await supabase
      .from('wallet_transactions')
      .update({
        status: 'completed',
        capture_id: captureId,
        metadata: { ...authTx.metadata, ...metadata }
      })
      .eq('id', authTx.id);

    if (updateTxError) throw updateTxError;

    return res.status(200).json({
      success: true,
      captureId,
      authorizationId,
      amountCents,
      newBalanceCents: newBalance,
      newBalance: newBalance / 100,
      status: 'captured'
    });

  } catch (error) {
    console.error('Capture API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

