// api/wallets/passes/google.js - Generate Google Wallet pass
// Vercel serverless function

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

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

const JWT_SECRET = process.env.JWT_SECRET || 'wallet-secret-key-change-in-production';
const TOKEN_EXPIRATION = 24 * 60 * 60; // 24 hours

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

    const walletId = req.query.walletId || req.body.walletId;
    const mode = req.body.mode || 'qr';

    if (!walletId) {
      return res.status(400).json({ error: 'walletId required' });
    }

    if (mode !== 'qr' && mode !== 'nfc') {
      return res.status(400).json({ error: 'mode must be "qr" or "nfc"' });
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Generate QR token for QR mode
    let qrToken = null;
    if (mode === 'qr') {
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION * 1000);
      const payload = {
        walletId,
        userId,
        type: 'qr_payment',
        mode: 'qr',
        passType: 'google',
        expiresAt: expiresAt.toISOString()
      };

      qrToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRATION
      });

      await supabase
        .from('wallet_tokens')
        .insert({
          wallet_id: walletId,
          user_id: userId,
          token: qrToken,
          token_type: 'qr_payment',
          expires_at: expiresAt.toISOString(),
          status: 'active',
          metadata: { mode: 'qr', passType: 'google' }
        });
    }

    // Call external wallet-pass-service
    const walletPassServiceUrl = process.env.WALLET_PASS_SERVICE_URL || 'http://localhost:3000';
    const walletServiceApiKey = process.env.WALLET_SERVICE_API_KEY || '';

    const passServiceResponse = await fetch(`${walletPassServiceUrl}/api/passes/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': walletServiceApiKey,
      },
      body: JSON.stringify({
        wallet_id: walletId,
        balance_cents: wallet.balance_cents || 0,
        mode,
        qr_token: qrToken,
        user_name: wallet.userName || 'Carrabbas Guest'
      })
    });

    if (!passServiceResponse.ok) {
      const errorData = await passServiceResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Pass service error: ${passServiceResponse.status}`);
    }

    const passData = await passServiceResponse.json();
    const passId = passData.passId?.split('.').pop() || `OP-${walletId}-${Date.now()}`;

    // Save pass to database
    const { data: passRecord, error: passError } = await supabase
      .from('wallet_passes')
      .insert({
        wallet_id: walletId,
        user_id: userId,
        platform: 'google',
        serial_number: passId,
        pass_data: passData.passObject || {},
        status: 'active'
      })
      .select()
      .single();

    if (passError) {
      console.error('Error saving pass:', passError);
    }

    // Update wallet
    await supabase
      .from('wallets')
      .update({ 
        google_pass_id: passId,
        wallet_mode: mode
      })
      .eq('id', walletId);

    // Return pass data with save URL
    return res.status(200).json({
      success: true,
      platform: 'google',
      passId: passData.passId,
      saveUrl: passData.saveUrl,
      passObject: passData.passObject,
      mode,
      qrToken: mode === 'qr' ? qrToken : null,
      note: mode === 'nfc' ? 'NFC mode requires Marqeta integration (Phase 2)' : null
    });

  } catch (error) {
    console.error('Google pass generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

