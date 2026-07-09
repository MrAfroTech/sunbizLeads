/**
 * Coffee & Conversations Collective - Loyalty API
 * Manages loyalty accounts and points
 */

const { sampleLoyaltyAccount } = require('../../schemas/loyalty-schema');

let mockLoyaltyAccounts = [sampleLoyaltyAccount];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET /:customer_id - Get loyalty account
    if (req.method === 'GET') {
      const customerId = req.url.split('/').pop().split('?')[0];
      
      const account = mockLoyaltyAccounts.find(a => a.customer_id === customerId || a.id === customerId);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Loyalty account not found'
        });
      }
      
      // Get tier color
      const tierColors = {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: '#FFD700',
        platinum: '#E5E4E2'
      };
      
      return res.status(200).json({
        success: true,
        loyaltyAccount: {
          ...account,
          tier_color: tierColors[account.tier_level]
        },
        customer: {
          first_name: 'Emma',
          last_name: 'Johnson',
          email: 'emma@example.com'
        }
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Loyalty API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

