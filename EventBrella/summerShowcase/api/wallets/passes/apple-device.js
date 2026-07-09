// api/wallets/passes/apple-device.js - Apple Wallet device registration endpoints
// Vercel serverless function
// Handles: device registration, pass updates, error logging

const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

module.exports = async (req, res) => {
  // Apple Wallet endpoints use specific paths
  const path = req.url;
  
  // Device registration: POST /v1/devices/:deviceId/registrations/:passTypeId/:serialNumber
  if (path.includes('/devices/') && path.includes('/registrations/')) {
    if (req.method === 'POST') {
      try {
        const parts = path.split('/');
        const deviceId = parts[parts.indexOf('devices') + 1];
        const passTypeId = parts[parts.indexOf('registrations') + 1];
        const serialNumber = parts[parts.indexOf('registrations') + 2];

        const supabase = getSupabase();
        const pushToken = req.body.pushToken;

        // Update pass with device registration
        const { error } = await supabase
          .from('wallet_passes')
          .update({
            device_library_identifier: deviceId,
            push_token: pushToken,
            updated_at: new Date().toISOString()
          })
          .eq('serial_number', serialNumber)
          .eq('pass_type_id', passTypeId)
          .eq('platform', 'apple');

        if (error) {
          console.error('Device registration error:', error);
          return res.status(500).json({ error: 'Registration failed' });
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    // Unregister: DELETE /v1/devices/:deviceId/registrations/:passTypeId/:serialNumber
    if (req.method === 'DELETE') {
      try {
        const parts = path.split('/');
        const deviceId = parts[parts.indexOf('devices') + 1];
        const passTypeId = parts[parts.indexOf('registrations') + 1];
        const serialNumber = parts[parts.indexOf('registrations') + 2];

        const supabase = getSupabase();

        await supabase
          .from('wallet_passes')
          .update({
            device_library_identifier: null,
            push_token: null
          })
          .eq('serial_number', serialNumber)
          .eq('device_library_identifier', deviceId);

        return res.status(200).json({ success: true });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }
  }

  // Get updated pass: GET /v1/passes/:passTypeId/:serialNumber
  if (path.includes('/passes/') && req.method === 'GET') {
    try {
      const parts = path.split('/');
      const passTypeId = parts[parts.indexOf('passes') + 1];
      const serialNumber = parts[parts.indexOf('passes') + 2];

      const supabase = getSupabase();

      const { data: pass, error } = await supabase
        .from('wallet_passes')
        .select('*, wallets(*)')
        .eq('serial_number', serialNumber)
        .eq('pass_type_id', passTypeId)
        .eq('platform', 'apple')
        .eq('status', 'active')
        .single();

      if (error || !pass) {
        return res.status(404).json({ error: 'Pass not found' });
      }

      // Update balance in pass data
      const wallet = pass.wallets;
      const updatedPassData = {
        ...pass.pass_data,
        storeCard: {
          ...pass.pass_data.storeCard,
          primaryFields: [
            {
              key: 'balance',
              label: 'Balance',
              value: `$${((wallet.balance_cents || 0) / 100).toFixed(2)}`
            }
          ]
        }
      };

      // In real implementation, generate .pkpass file
      return res.status(200).json({
        success: true,
        passData: updatedPassData,
        lastModified: pass.updated_at
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Error logging: POST /v1/log
  if (path.includes('/log') && req.method === 'POST') {
    try {
      const logData = req.body;
      console.error('Apple Wallet error log:', logData);
      
      // In real implementation, save to error log table
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).json({ error: 'Endpoint not found' });
};

