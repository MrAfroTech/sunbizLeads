/** Share of peak-night guests who wait too long (industry abandon/wait benchmark). */
export const WAIT_TOO_LONG_RATE = 0.45;
/** Share of guests who waited too long and will not return. */
export const WONT_RETURN_RATE = 0.5;
/** Share of guests who would spend more if ordering was faster (hero stat). */
export const SPEND_MORE_RATE = 0.77;
/** Estimated future visits per lost guest for LTV (annual repeat-visit proxy). */
export const LIFETIME_VISITS_PER_GUEST = 12;

/**
 * Hospitality wait-time revenue model for /calculator/wait.
 * @returns {{
 *   customersWhoWaited: number,
 *   customersWhoWontReturn: number,
 *   missedRevenueThatNight: number,
 *   ltvLoss: number,
 *   totalRevenueImpact: number,
 * }}
 */
export function computeWaitCalculatorMetrics({
  peakNightCustomers,
  averageSpendPerCustomer,
}) {
  const customers = parseFloat(peakNightCustomers) || 0;
  const spend = parseFloat(averageSpendPerCustomer) || 0;

  const customersWhoWaited = customers * WAIT_TOO_LONG_RATE;
  const customersWhoWontReturn = customersWhoWaited * WONT_RETURN_RATE;
  const missedRevenueThatNight = customersWhoWaited * spend * SPEND_MORE_RATE;
  const ltvLoss = customersWhoWontReturn * spend * LIFETIME_VISITS_PER_GUEST;
  const totalRevenueImpact = missedRevenueThatNight + ltvLoss;

  return {
    customersWhoWaited,
    customersWhoWontReturn,
    missedRevenueThatNight,
    ltvLoss,
    totalRevenueImpact,
  };
}
