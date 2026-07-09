// api/wallets/passes/apple.js - Generate Apple Wallet pass
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
const TOKEN_EXPIRATION = 24 * 60 * 60; // 24 hours for pass tokens

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
    const mode = req.body.mode || 'qr'; // Default to QR mode

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
        passType: 'apple',
        expiresAt: expiresAt.toISOString()
      };

      qrToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRATION
      });

      // Save token to database
      await supabase
        .from('wallet_tokens')
        .insert({
          wallet_id: walletId,
          user_id: userId,
          token: qrToken,
          token_type: 'qr_payment',
          expires_at: expiresAt.toISOString(),
          status: 'active',
          metadata: { mode: 'qr', passType: 'apple' }
        });
    }

    // Call external wallet-pass-service
    const walletPassServiceUrl = process.env.WALLET_PASS_SERVICE_URL || 'http://localhost:3000';
    const walletServiceApiKey = process.env.WALLET_SERVICE_API_KEY || '';

    const passServiceResponse = await fetch(`${walletPassServiceUrl}/api/passes/apple`, {
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

    // Get .pkpass file buffer
    const passBuffer = await passServiceResponse.arrayBuffer();
    const serialNumber = `OP-${walletId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save pass to database
    const { data: passRecord, error: passError } = await supabase
      .from('wallet_passes')
      .insert({
        wallet_id: walletId,
        user_id: userId,
        platform: 'apple',
        serial_number: serialNumber,
        pass_type_id: process.env.APPLE_PASS_TYPE_ID || 'pass.com.carrabbas.wallet',
        pass_data: { mode, generatedAt: new Date().toISOString() },
        status: 'active'
      })
      .select()
      .single();

    if (passError) {
      console.error('Error saving pass:', passError);
      // Continue anyway
    }

    // Update wallet with serial number
    await supabase
      .from('wallets')
      .update({ 
        apple_pass_serial: serialNumber,
        wallet_mode: mode
      })
      .eq('id', walletId);

    // Return .pkpass file
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="carrabbas-wallet.pkpass"`);
    res.setHeader('Content-Length', passBuffer.byteLength);
    return res.send(Buffer.from(passBuffer));

  } catch (error) {
    console.error('Apple pass generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

