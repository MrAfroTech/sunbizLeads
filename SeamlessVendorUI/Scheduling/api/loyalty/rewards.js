/**
 * Coffee & Conversations Collective - Loyalty Rewards Catalog API
 * Returns available rewards for redemption
 */

const { sampleLoyaltyRewards } = require('../../schemas/loyalty-schema');

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
    const { active } = req.query;
    
    let rewards = [...sampleLoyaltyRewards];
    
    if (active !== undefined) {
      rewards = rewards.filter(r => r.active === (active === 'true'));
    }
    
    return res.status(200).json({
      success: true,
      rewards
    });
    
  } catch (error) {
    console.error('Rewards API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

