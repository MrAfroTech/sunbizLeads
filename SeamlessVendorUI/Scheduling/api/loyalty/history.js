/**
 * Coffee & Conversations Collective - Loyalty Transaction History API
 * Returns points transaction history for a customer
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const customerId = req.url.split('/').pop().split('?')[0];
    
    // Mock transaction history
    const transactions = [
      {
        id: 'ltx_001',
        customer_id: customerId,
        transaction_type: 'earned',
        points: 86,
        booking_id: 'booking_001',
        description: 'Deep Tissue Massage booking',
        balance_after: 3250,
        created_at: new Date().toISOString()
      },
      {
        id: 'ltx_002',
        customer_id: customerId,
        transaction_type: 'earned',
        points: 95,
        booking_id: 'booking_002',
        description: 'Swedish Massage booking',
        balance_after: 3164,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ltx_003',
        customer_id: customerId,
        transaction_type: 'referral',
        points: 500,
        description: 'Referral bonus - Friend joined',
        balance_after: 3069,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ltx_004',
        customer_id: customerId,
        transaction_type: 'redeemed',
        points: -1000,
        description: 'Redeemed: Free 30-Min Massage Upgrade',
        balance_after: 2569,
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ltx_005',
        customer_id: customerId,
        transaction_type: 'birthday',
        points: 500,
        description: 'Birthday bonus points',
        balance_after: 3569,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return res.status(200).json({
      success: true,
      transactions
    });
    
  } catch (error) {
    console.error('History API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

