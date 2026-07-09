// GET /api/stripe-config - Expose Stripe publishable key and test mode to the frontend (safe to expose)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const IS_TEST_MODE = process.env.TEST_MODE === 'true';
const PUBLISHABLE_KEY = IS_TEST_MODE
  ? (process.env.STRIPE_TEST_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY)
  : (process.env.STRIPE_LIVE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    publishableKey: PUBLISHABLE_KEY || '',
    testMode: IS_TEST_MODE,
  });
};
