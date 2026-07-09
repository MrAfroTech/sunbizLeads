/** Share of annual revenue assumed from referrals and repeat bookings. */
export const REFERRAL_RATE = 0.6;

export const PLANNER_TYPE_OPTIONS = [
  'Independent Event Planner',
  'Event Planning Company (2–10 staff)',
  'Corporate Event Manager',
  'Wedding Planner',
];

export const HANDOFF_QUALITY_OPTIONS = [
  'Spreadsheet or notes shared with venue',
  'Verbal brief to venue staff day-of',
  'No formal system',
  'We use a guest management platform',
];

/** @deprecated Use PLANNER_TYPE_OPTIONS */
export const EVENT_ROLE_OPTIONS = PLANNER_TYPE_OPTIONS;

export const HANDOFF_DROP_RATES = {
  'Spreadsheet or notes shared with venue': 0.25,
  'Verbal brief to venue staff day-of': 0.45,
  'No formal system': 0.6,
  'We use a guest management platform': 0.08,
};

export const PLANNER_MULTIPLIERS = {
  'Independent Event Planner': 1.0,
  'Event Planning Company (2–10 staff)': 1.15,
  'Corporate Event Manager': 1.2,
  'Wedding Planner': 1.05,
};

export const GUEST_EXPERIENCE_MOMENT_DEFS = [
  { id: 1, name: 'Guest preference dropped at arrival', shortLabel: 'First impression failure' },
  { id: 2, name: 'Dietary or allergy flag missed', shortLabel: 'Trust-breaker moment' },
  { id: 3, name: 'VIP guest goes unrecognized', shortLabel: 'The moment that ends the re-book' },
  { id: 4, name: 'Service sequence out of order', shortLabel: 'Close-out confusion' },
  { id: 5, name: 'Post-event follow-up never happened', shortLabel: 'Referral window missed' },
  { id: 6, name: 'No record of what worked', shortLabel: "You're starting from zero every time" },
];

export function handoffDropRate(handoffQuality) {
  return HANDOFF_DROP_RATES[handoffQuality] ?? 0;
}

export function plannerMultiplier(plannerType) {
  return PLANNER_MULTIPLIERS[plannerType] ?? 1;
}

/**
 * Guest Experience Gap model for /calculator/events.
 * @returns {{
 *   plannerType: string,
 *   handoffQuality: string,
 *   eventsPerYear: number,
 *   avgEventFee: number,
 *   dropRate: number,
 *   plannerMultiplier: number,
 *   annualRevenue: number,
 *   affectedEvents: number,
 *   moment1: number,
 *   moment2: number,
 *   moment3: number,
 *   moment4: number,
 *   moment5: number,
 *   moment6: number,
 *   total_gap: number,
 *   totalRevenueImpact: number,
 *   missedRevenueThatNight: number,
 * }}
 */
export function computeGuestExperienceGapMetrics({
  plannerType,
  handoffQuality,
  eventsPerYear,
  avgEventFee,
}) {
  const events = parseFloat(eventsPerYear) || 0;
  const fee = parseFloat(avgEventFee) || 0;
  const dropRate = handoffDropRate(handoffQuality);
  const mult = plannerMultiplier(plannerType);

  const annualRevenue = events * fee;
  const affectedEvents = events * dropRate;

  const moment1 = affectedEvents * fee * 0.08 * mult;
  const moment2 = affectedEvents * fee * 0.12 * mult;
  const moment3 = affectedEvents * fee * 0.18 * mult;
  const moment4 = affectedEvents * fee * 0.1 * mult;
  const moment5 = annualRevenue * REFERRAL_RATE * 0.07 * mult;
  const moment6 = annualRevenue * 0.05 * mult;
  const total_gap = moment1 + moment2 + moment3 + moment4 + moment5 + moment6;

  return {
    plannerType,
    handoffQuality,
    eventsPerYear: events,
    avgEventFee: fee,
    dropRate,
    plannerMultiplier: mult,
    annualRevenue,
    affectedEvents,
    moment1,
    moment2,
    moment3,
    moment4,
    moment5,
    moment6,
    total_gap,
    totalRevenueImpact: total_gap,
    missedRevenueThatNight: moment3,
  };
}

/** @deprecated */
export function computeEventCalculatorMetrics({
  role,
  plannerType,
  handoffQuality,
  ticketPrice,
  attendance,
  eventsPerYear,
  avgEventFee,
}) {
  return computeGuestExperienceGapMetrics({
    plannerType: plannerType || role,
    handoffQuality,
    eventsPerYear: eventsPerYear ?? attendance,
    avgEventFee: avgEventFee ?? ticketPrice,
  });
}

/** Six-moment cards for CalculatorLeakResults (Moment 3 is the free reveal). */
export function computeGuestExperienceGapMomentAmounts(metrics) {
  if (!metrics) return [];

  const amounts = {
    1: metrics.moment1,
    2: metrics.moment2,
    3: metrics.moment3,
    4: metrics.moment4,
    5: metrics.moment5,
    6: metrics.moment6,
  };

  return GUEST_EXPERIENCE_MOMENT_DEFS.map((moment) => ({
    ...moment,
    amount: amounts[moment.id] || 0,
    spanFull: moment.id === 6,
  }));
}
