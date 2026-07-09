/**
 * Coffee & Conversations Collective - Earn Loyalty Points API
 * Awards points to customer loyalty account
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const { customer_id, points, booking_id, description } = req.body;
      
      // In production: Update loyalty account in database
      // Award points and create transaction record
      
      return res.status(200).json({
        success: true,
        message: 'Points awarded successfully',
        points_awarded: points,
        new_balance: 3250 // Mock balance
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Earn points API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

