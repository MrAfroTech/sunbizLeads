export const UrgencyTier = Object.freeze({
  TIER_1_HIGH: 'TIER_1_HIGH',
  TIER_2_MEDIUM: 'TIER_2_MEDIUM',
  TIER_3_LOW: 'TIER_3_LOW'
});

/**
 * Rule-based tiering:
 * - Tier 1: budget >= 500 AND (timeline is immediate or within 30 days)
 * - Tier 2: budget 200..499 OR timeline 1-3 months
 * - Tier 3: budget < 200 OR timeline > 3 months
 *
 * If inputs are missing/unknown, defaults conservatively to Tier 3.
 */
export function scoreUrgency({ budget, purchaseTimelineNormalized }) {
  const b = typeof budget === 'number' && Number.isFinite(budget) ? budget : null;
  const t = purchaseTimelineNormalized ?? 'unknown';

  const isImmediateOr30 =
    t === 'immediately' || t === 'within_30_days' || t === '0_30_days';

  const is1to3Months = t === '1_3_months';
  const isOver3Months = t === 'over_3_months';

  if (b != null && b >= 500 && isImmediateOr30) return UrgencyTier.TIER_1_HIGH;

  if (
    (b != null && b >= 200 && b <= 499) ||
    is1to3Months
  ) {
    return UrgencyTier.TIER_2_MEDIUM;
  }

  if ((b != null && b < 200) || isOver3Months) return UrgencyTier.TIER_3_LOW;

  return UrgencyTier.TIER_3_LOW;
}

