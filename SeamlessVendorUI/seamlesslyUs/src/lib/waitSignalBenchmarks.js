import {
  WAIT_TOO_LONG_RATE,
  WONT_RETURN_RATE,
  SPEND_MORE_RATE,
  computeWaitCalculatorMetrics,
} from './waitCalculatorMath';

/** Mid-size venue baseline for presentation / Loom deck. */
export const VENUE_COVERS_PER_WEEK = 500;
export const PEAK_SERVICE_NIGHTS_PER_WEEK = 4;
export const DEFAULT_AVERAGE_SPEND = 45;

/** Diners who have scanned a QR code to order since 2021 (published adoption benchmark). */
export const QR_SCAN_ADOPTION_RATE = 0.72;

/** Repeat guests vs anonymous first-timers spend premium (high end of recognition gap). */
export const REPEAT_VS_ANONYMOUS_SPEND_PREMIUM = 0.29;

/** Guest intelligence captured by most QR systems at point of sale. */
export const QR_GUEST_INTELLIGENCE_CAPTURE = 0;

/** Guests waiting 10+ minutes without an update — return-visit benchmark threshold. */
export const WAIT_NO_UPDATE_MINUTES = 10;

/** Unrecognized vs recognized returning guest spend gap (published hospitality range). */
export const UNRECOGNIZED_SPEND_GAP_LOW = 0.13;
export const UNRECOGNIZED_SPEND_GAP_HIGH = 0.29;

/** Revenue left on table per service period when wait friction is unaddressed. */
export const WAIT_FRICTION_REVENUE_LEAK_RATE = 0.15;

/** Data-driven scheduling labor waste reduction benchmark. */
export const LABOR_WASTE_RATE = 0.2;
export const LABOR_SAVINGS_PER_WEEK = 400;
export const LABOR_SAVINGS_ANNUAL = 20000;

/** Monthly inventory overrun from gut-based purchasing. */
export const INVENTORY_OVERRUN_LOW = 600;
export const INVENTORY_OVERRUN_HIGH = 1200;

/** Combined monthly impact for a 500-cover venue (published benchmark range). */
export const COMBINED_MONTHLY_IMPACT_LOW = 4800;
export const COMBINED_MONTHLY_IMPACT_HIGH = 7200;

export const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

export const formatPercent = (rate) =>
  `${Math.round(rate * 100)}%`;

export const formatPercentRange = (low, high) =>
  `${Math.round(low * 100)}–${Math.round(high * 100)}%`;

export const formatMoneyRange = (low, high) =>
  `${formatMoney(low)}–${formatMoney(high)}`;

export function getPeakNightCustomers(coversPerWeek = VENUE_COVERS_PER_WEEK) {
  return Math.round(coversPerWeek / PEAK_SERVICE_NIGHTS_PER_WEEK);
}

/**
 * Calculator metrics for the presentation venue baseline (500 covers/week).
 * Uses the same formula as /calculator/wait.
 */
export function computePresentationVenueMetrics({
  coversPerWeek = VENUE_COVERS_PER_WEEK,
  averageSpendPerCustomer = DEFAULT_AVERAGE_SPEND,
} = {}) {
  const peakNightCustomers = getPeakNightCustomers(coversPerWeek);
  const metrics = computeWaitCalculatorMetrics({
    peakNightCustomers,
    averageSpendPerCustomer,
  });

  const guestsWhoWait = Math.round(metrics.customersWhoWaited);
  const guestsWhoWontReturn = Math.round(metrics.customersWhoWontReturn);
  const waitFrictionLeakPerNight =
    peakNightCustomers * averageSpendPerCustomer * WAIT_FRICTION_REVENUE_LEAK_RATE;

  return {
    coversPerWeek,
    peakNightCustomers,
    averageSpendPerCustomer,
    guestsWhoWait,
    guestsWhoWontReturn,
    missedRevenueThatNight: metrics.missedRevenueThatNight,
    ltvLoss: metrics.ltvLoss,
    totalRevenueImpact: metrics.totalRevenueImpact,
    waitFrictionLeakPerNight,
    waitTooLongRate: WAIT_TOO_LONG_RATE,
    wontReturnRate: WONT_RETURN_RATE,
    spendMoreRate: SPEND_MORE_RATE,
  };
}

/** Slide 7 table rows — values driven from shared benchmark constants. */
export function getSignalImpactRows() {
  return [
    {
      id: 'recognition',
      signal: 'Unrecognized returning guests',
      costing: `${formatPercentRange(UNRECOGNIZED_SPEND_GAP_LOW, UNRECOGNIZED_SPEND_GAP_HIGH)} spend gap per visit`,
      change: 'Guest profile follows every scan',
    },
    {
      id: 'labor',
      signal: 'Scheduling by intuition',
      costing: `Up to ${formatPercent(LABOR_WASTE_RATE)} labor waste`,
      change: 'Forecast built on actual visit patterns',
    },
    {
      id: 'inventory',
      signal: 'Inventory by gut',
      costing: `${formatMoneyRange(INVENTORY_OVERRUN_LOW, INVENTORY_OVERRUN_HIGH)}/mo overrun`,
      change: 'Purchase data tied to guest behavior',
    },
  ];
}

export function getCombinedMonthlyImpactLabel() {
  return formatMoneyRange(COMBINED_MONTHLY_IMPACT_LOW, COMBINED_MONTHLY_IMPACT_HIGH);
}
