// api/wallets/passes/index.js - List and manage wallet passes
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
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

    // GET - List active passes
    if (req.method === 'GET') {
      const { data: passes, error } = await supabase
        .from('wallet_passes')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        passes: passes || [],
        total: passes?.length || 0
      });
    }

    // DELETE - Revoke pass
    if (req.method === 'DELETE') {
      const { platform } = req.query;

      if (!platform || (platform !== 'apple' && platform !== 'google')) {
        return res.status(400).json({ error: 'platform must be "apple" or "google"' });
      }

      // Update pass status to revoked
      const { data: pass, error } = await supabase
        .from('wallet_passes')
        .update({ status: 'revoked' })
        .eq('wallet_id', walletId)
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('status', 'active')
        .select()
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!pass) {
        return res.status(404).json({ error: 'Active pass not found' });
      }

      // In real implementation:
      // - For Apple: Send push notification to unregister
      // - For Google: Delete pass via Google Wallet API

      return res.status(200).json({
        success: true,
        message: `Pass revoked for ${platform}`,
        passId: pass.serial_number
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Passes API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

