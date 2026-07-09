/**
 * Google Wallet Pass Routes
 * 
 * Handles POST /api/passes/google
 * Generates and returns pass save URL
 */

const express = require('express');
const router = express.Router();
const passGenerator = require('../services/PassGenerator');

/**
 * POST /api/passes/google
 * Generate Google Wallet pass
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
    const result = await passGenerator.generateGooglePass({
      wallet_id,
      balance_cents: parseInt(balance_cents),
      mode: mode || 'qr',
      qr_token,
      user_name: user_name || 'Orlando Pirates Fan'
    });

    // Return pass URL and metadata
    res.json({
      success: true,
      platform: 'google',
      passId: result.passId,
      saveUrl: result.saveUrl,
      passObject: result.passObject
    });

  } catch (error) {
    console.error('Google pass generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Google Wallet pass'
    });
  }
});

module.exports = router;

