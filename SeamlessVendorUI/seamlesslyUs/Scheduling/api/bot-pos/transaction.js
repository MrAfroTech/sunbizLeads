/**
 * Coffee & Conversations Collective - BOT POS Transaction Status API
 * Retrieves transaction details from BOT POS
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
    if (req.method === 'GET') {
      const transactionId = req.url.split('/').pop().split('?')[0];
      
      // In production, query BOT POS API for transaction status
      
      // Mock BOT POS transaction response
      const transaction = {
        transaction_id: transactionId,
        amount: 95.00,
        status: 'completed',
        payment_method: 'credit_card',
        processed_at: new Date().toISOString(),
        receipt_url: `https://botpos.example.com/receipts/${transactionId}`
      };
      
      return res.status(200).json({
        success: true,
        transaction
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('BOT POS transaction API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction',
      error: error.message
    });
  }
};

