// api/wallets/authorize.js - Authorize payment (reserve funds)
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

    const { walletId, amountCents, metadata } = req.body;

    if (!walletId || !amountCents || amountCents <= 0) {
      return res.status(400).json({ error: 'walletId and valid amountCents required' });
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .eq('user_id', userId)
      .single();

    if (walletError) throw walletError;

    // Check balance
    if ((wallet.balance_cents || 0) < amountCents) {
      return res.status(400).json({
        error: 'Insufficient funds',
        balanceCents: wallet.balance_cents || 0,
        requestedCents: amountCents
      });
    }

    // Create authorization transaction
    const authorizationId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15 minutes

    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        user_id: userId,
        transaction_type: 'authorize',
        amount_cents: amountCents,
        authorization_id: authorizationId,
        status: 'pending',
        description: metadata?.description || 'Payment authorization',
        metadata: metadata || {}
      })
      .select()
      .single();

    if (txError) throw txError;

    return res.status(200).json({
      success: true,
      authorizationId,
      amountCents,
      expiresAt,
      status: 'authorized',
      transactionId: transaction.id
    });

  } catch (error) {
    console.error('Authorize API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

