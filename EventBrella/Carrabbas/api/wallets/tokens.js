// api/wallets/tokens.js - Generate and validate QR tokens
// Vercel serverless function

const jwt = require('jsonwebtoken');
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

const JWT_SECRET = process.env.JWT_SECRET || 'wallet-secret-key-change-in-production';
const TOKEN_EXPIRATION = 15 * 60; // 15 minutes

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = getSupabase();
    const userId = getUserId(req);

    // POST /api/wallets/tokens - Generate token
    if (req.method === 'POST') {
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      const { walletId, amountCents, tokenType = 'qr_payment' } = req.body;

      if (!walletId) {
        return res.status(400).json({ error: 'walletId required' });
      }

      // Verify wallet belongs to user
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, user_id')
        .eq('id', walletId)
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Generate token
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION * 1000);
      const payload = {
        walletId,
        userId,
        amountCents,
        type: tokenType,
        expiresAt: expiresAt.toISOString()
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRATION
      });

      // Save token to database
      const { error: tokenError } = await supabase
        .from('wallet_tokens')
        .insert({
          wallet_id: walletId,
          user_id: userId,
          token,
          token_type: tokenType,
          expires_at: expiresAt.toISOString(),
          amount_cents: amountCents,
          status: 'active'
        });

      if (tokenError) {
        console.error('Error saving token:', tokenError);
        // Continue anyway - token is still valid
      }

      return res.status(200).json({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        walletId,
        amountCents
      });
    }

    // GET /api/wallets/tokens?token=xxx - Validate token
    if (req.method === 'GET') {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }

      try {
        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check expiration
        if (new Date(decoded.expiresAt) < new Date()) {
          return res.status(400).json({
            success: false,
            valid: false,
            error: 'Token has expired'
          });
        }

        // Check token status in database
        const { data: tokenRecord, error: tokenError } = await supabase
          .from('wallet_tokens')
          .select('*')
          .eq('token', token)
          .single();

        if (tokenError || !tokenRecord) {
          return res.status(400).json({
            success: false,
            valid: false,
            error: 'Token not found'
          });
        }

        if (tokenRecord.status !== 'active') {
          return res.status(400).json({
            success: false,
            valid: false,
            error: `Token is ${tokenRecord.status}`
          });
        }

        return res.status(200).json({
          success: true,
          valid: true,
          data: decoded,
          tokenRecord: {
            walletId: tokenRecord.wallet_id,
            amountCents: tokenRecord.amount_cents,
            tokenType: tokenRecord.token_type
          }
        });

      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          return res.status(400).json({
            success: false,
            valid: false,
            error: 'Invalid token'
          });
        }
        if (error.name === 'TokenExpiredError') {
          return res.status(400).json({
            success: false,
            valid: false,
            error: 'Token has expired'
          });
        }
        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Tokens API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

