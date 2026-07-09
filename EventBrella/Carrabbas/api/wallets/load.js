// api/wallets/load.js - Load funds into wallet
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

    const { amountCents, paymentDetails } = req.body;

    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    // Get or create wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError;
    }

    if (!wallet) {
      // Create wallet
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
      wallet = newWallet;
    }

    // Update balance
    const newBalance = (wallet.balance_cents || 0) + amountCents;
    
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({ balance_cents: newBalance })
      .eq('id', wallet.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create transaction record
    const transactionId = `txn_load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: userId,
        transaction_type: 'load',
        amount_cents: amountCents,
        status: 'completed',
        description: 'Added funds',
        metadata: { paymentDetails }
      });

    if (txError) {
      console.error('Error creating transaction:', txError);
      // Don't fail the request, but log the error
    }

    return res.status(200).json({
      success: true,
      transactionId,
      walletId: wallet.id,
      amountCents,
      newBalanceCents: newBalance,
      newBalance: newBalance / 100
    });

  } catch (error) {
    console.error('Load funds API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

