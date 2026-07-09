import { normalizePurchaseTimeline, parseBudgetToMonthlyUsd } from '../../../packages/shared/src/typeform.js';
import { scoreUrgency } from '../../../packages/shared/src/scoring.js';

export function computeTier({ budgetRaw, purchaseTimelineRaw }) {
  const budget = parseBudgetToMonthlyUsd(budgetRaw);
  const purchaseTimelineNormalized = normalizePurchaseTimeline(purchaseTimelineRaw);
  const urgencyTier = scoreUrgency({ budget, purchaseTimelineNormalized });
  return { budget, purchaseTimelineNormalized, urgencyTier };
}

