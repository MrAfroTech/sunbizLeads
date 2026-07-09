// api/wallets/refund.js - Refund captured payment
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

    const { captureId, amountCents, metadata } = req.body;

    if (!captureId) {
      return res.status(400).json({ error: 'captureId required' });
    }

    // Get capture transaction
    const { data: captureTx, error: captureError } = await supabase
      .from('wallet_transactions')
      .select('*, wallets(*)')
      .eq('capture_id', captureId)
      .eq('user_id', userId)
      .eq('transaction_type', 'authorize')
      .eq('status', 'completed')
      .single();

    if (captureError) {
      return res.status(404).json({ error: 'Capture not found' });
    }

    const wallet = captureTx.wallets;
    const refundAmount = amountCents || captureTx.amount_cents; // Full refund if not specified

    // Add back to balance
    const newBalance = (wallet.balance_cents || 0) + refundAmount;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance_cents: newBalance })
      .eq('id', wallet.id);

    if (updateError) throw updateError;

    // Create refund transaction
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error: refundTxError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: userId,
        transaction_type: 'refund',
        amount_cents: refundAmount,
        capture_id: captureId,
        refund_id: refundId,
        status: 'completed',
        description: metadata?.description || 'Refund',
        metadata: metadata || {}
      });

    if (refundTxError) throw refundTxError;

    return res.status(200).json({
      success: true,
      refundId,
      captureId,
      amountCents: refundAmount,
      newBalanceCents: newBalance,
      newBalance: newBalance / 100,
      status: 'refunded'
    });

  } catch (error) {
    console.error('Refund API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

