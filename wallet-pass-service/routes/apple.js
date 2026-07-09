/**
 * Apple Wallet Pass Routes
 * 
 * Handles POST /api/passes/apple
 * Generates and returns .pkpass file
 */

const express = require('express');
const router = express.Router();
const passGenerator = require('../services/PassGenerator');

/**
 * POST /api/passes/apple
 * Generate Apple Wallet pass
 * 
 * Body:
 * {
 *   "wallet_id": "uuid",
 *   "balance_cents": 5000,
 *   "mode": "qr",
 *   "qr_token": "jwt-token-here",
 *   "user_name": "John Doe"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { wallet_id, balance_cents, mode, qr_token, user_name } = req.body;

    // Validate required fields
    if (!wallet_id) {
      return res.status(400).json({
        success: false,
        error: 'wallet_id is required'
      });
    }

    if (balance_cents === undefined || balance_cents === null) {
      return res.status(400).json({
        success: false,
        error: 'balance_cents is required'
      });
    }

    if (mode === 'qr' && !qr_token) {
      return res.status(400).json({
        success: false,
        error: 'qr_token is required for QR mode'
      });
    }

    // Generate pass
    const result = await passGenerator.generateApplePass({
      wallet_id,
      balance_cents: parseInt(balance_cents),
      mode: mode || 'qr',
      qr_token,
      user_name: user_name || 'Orlando Pirates Fan'
    });

    // Return .pkpass file
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="orlando-pirates-wallet.pkpass"`);
    res.setHeader('Content-Length', result.buffer.length);
    
    res.send(result.buffer);

  } catch (error) {
    console.error('Apple pass generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Apple Wallet pass'
    });
  }
});

module.exports = router;

