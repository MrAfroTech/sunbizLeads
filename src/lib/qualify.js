/**
 * Scoring and disqualification logic for Sunbiz dual-layer leads.
 */

/**
 * Score an entity for POS/PMS stack fit.
 * @param {object} entity - Raw or enriched entity (filingDate, status, physicalAddress, locations, dbaCount, layer)
 * @param {'est'|'new'} layer - 'est' = established multi-location, 'new' = new business
 * @returns {number} Score 0–100
 */
export function scoreEntity(entity, layer) {
  let score = 50;

  // Filing recency (both layers)
  const filingDate = entity.filingDate ? new Date(entity.filingDate) : null;
  const ageMonths = filingDate
    ? (Date.now() - filingDate.getTime()) / (30 * 86400000)
    : 24;
  if (ageMonths <= 6) score += 20;
  else if (ageMonths <= 12) score += 12;
  else if (ageMonths <= 18) score += 6;

  // Layer 1: reward multi-location signals
  if (layer === 'est') {
    const locations = entity.locations ?? 1;
    if (locations >= 5) score += 20;
    else if (locations >= 3) score += 12;
    const dbaCount = entity.dbaCount ?? 0;
    if (dbaCount > 1) score += 8;
  }

  // Layer 2: reward very recent + physical address + keyword match
  if (layer === 'new') {
    if (ageMonths <= 3) score += 15; // brand new = high urgency
    if (entity.physicalAddress) score += 10;
    const locations = entity.locations ?? 1;
    if (locations === 1) score += 8; // single unit = POS need
  }

  // Penalize stale / weak signals
  if (!entity.physicalAddress) score -= 20;
  if (entity.status !== 'ACTIVE' && entity.status !== 'Active') score -= 30;

  return Math.min(Math.max(score, 0), 100);
}
