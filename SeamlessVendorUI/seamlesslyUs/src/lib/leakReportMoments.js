/** Presentation-only labels — not part of the revenue calculation engine. */
export const LEAK_MOMENT_DEFS = [
  { id: 1, name: 'Wait to be acknowledged', shortLabel: 'First impression delay' },
  { id: 2, name: 'Wait to order', shortLabel: 'Menu friction' },
  { id: 3, name: 'Wait to reorder', shortLabel: 'Second-round drop-off' },
  { id: 4, name: 'Wait for check', shortLabel: 'Close-out delay' },
  { id: 5, name: 'Wait to pay', shortLabel: 'Payment queue loss' },
  { id: 6, name: 'Wait for payment completed', shortLabel: 'Terminal lag' },
];

/** Only this moment exposes the existing calculator output value in the UI. */
export const VISIBLE_LEAK_MOMENT_ID = 3;

/** Four-moment set for /calculator/wait hero-card results (1 visible + 3 hidden). */
export const WAIT_HERO_LEAK_MOMENT_DEFS = [
  { id: 1, name: 'Wait to be acknowledged', shortLabel: 'First impression delay' },
  { id: 2, name: 'Wait to order', shortLabel: 'Menu friction' },
  { id: 3, name: 'Wait to reorder', shortLabel: 'Second-round drop-off' },
  { id: 4, name: 'Wait for check', shortLabel: 'Close-out delay' },
];

const WAIT_HERO_LOCKED_WEIGHTS = {
  1: 0.3,
  2: 0.35,
  4: 0.35,
};

const LOCKED_MOMENT_WEIGHTS = {
  1: 0.15,
  2: 0.18,
  4: 0.2,
  5: 0.22,
  6: 0.25,
};

/**
 * Distribute wait-calculator metrics across all six leak moments.
 * Moment 3 uses missedRevenueThatNight; others share the remainder of totalRevenueImpact.
 */
export function computeLeakMomentAmounts(metrics) {
  if (!metrics) return [];

  const moment3Amount = metrics.missedRevenueThatNight || 0;
  const remainder = Math.max((metrics.totalRevenueImpact || 0) - moment3Amount, 0);
  const weightSum = Object.values(LOCKED_MOMENT_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

  return LEAK_MOMENT_DEFS.map((moment) => {
    if (moment.id === VISIBLE_LEAK_MOMENT_ID) {
      return { ...moment, amount: moment3Amount };
    }
    const weight = LOCKED_MOMENT_WEIGHTS[moment.id] || 0;
    return {
      ...moment,
      amount: remainder * (weight / weightSum),
      spanFull: moment.id === 6,
    };
  });
}

/**
 * Wait hero layout: one visible leak line (moment 3) plus three hidden lines.
 */
export function computeWaitHeroLeakMoments(metrics) {
  if (!metrics) return [];

  const moment3Amount = metrics.missedRevenueThatNight || 0;
  const remainder = Math.max((metrics.totalRevenueImpact || 0) - moment3Amount, 0);
  const weightSum = Object.values(WAIT_HERO_LOCKED_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

  return WAIT_HERO_LEAK_MOMENT_DEFS.map((moment) => {
    if (moment.id === VISIBLE_LEAK_MOMENT_ID) {
      return { ...moment, amount: moment3Amount };
    }
    const weight = WAIT_HERO_LOCKED_WEIGHTS[moment.id] || 0;
    return {
      ...moment,
      amount: remainder * (weight / weightSum),
    };
  });
}
