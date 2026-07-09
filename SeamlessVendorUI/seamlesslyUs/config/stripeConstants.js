/**
 * Server-side Stripe constants (CommonJS mirror of src/config/stripeConstants.js).
 */

const CALCULATOR_PLUS_PRICE = {
  key: 'calculator-plus',
  envVar: 'STRIPE_PRICE_CALCULATOR_PLUS',
  amountCents: 1700,
  currency: 'usd',
  productName: 'Calculator Plus',
  productDescription:
    'Venue deployment blueprint, priority-ranked opportunities, ROI timeline, competitor benchmarking, and branded PDF report.',
};

function resolveCalculatorPlusStripePriceId() {
  return process.env[CALCULATOR_PLUS_PRICE.envVar]?.trim() || '';
}

module.exports = { CALCULATOR_PLUS_PRICE, resolveCalculatorPlusStripePriceId };
