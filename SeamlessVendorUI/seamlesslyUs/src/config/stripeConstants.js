/**
 * Stripe Checkout price keys for Seamlessly products.
 * Set STRIPE_PRICE_CALCULATOR_PLUS in Vercel env to the live/test Price ID (price_...).
 */

export const CALCULATOR_PLUS_PRICE = {
  key: 'calculator-plus',
  envVar: 'STRIPE_PRICE_CALCULATOR_PLUS',
  amountCents: 1700,
  currency: 'usd',
  productName: 'Calculator Plus',
  productDescription:
    'Venue deployment blueprint, priority-ranked opportunities, ROI timeline, competitor benchmarking, and branded PDF report.',
};

export function resolveCalculatorPlusStripePriceId() {
  const fromProcess =
    typeof process !== 'undefined' && process.env
      ? process.env[CALCULATOR_PLUS_PRICE.envVar]?.trim()
      : '';
  return fromProcess || '';
}
