/**
 * Qualification scoring — registry data only (no Places).
 */

export function scoreEntity(entity, layer) {
  let score = 50;

  const ageMonths = (Date.now() - new Date(entity.filingDate)) / (30 * 86400000);

  if (ageMonths <= 6) score += 20;
  else if (ageMonths <= 12) score += 12;
  else if (ageMonths <= 18) score += 6;

  const locations = entity.locations ?? 1;

  if (layer === 'est') {
    if (locations >= 5) score += 20;
    else if (locations >= 3) score += 12;
    if ((entity.dbaCount ?? 0) > 1) score += 8;
  }

  if (layer === 'new') {
    if (ageMonths <= 3) score += 15;
    if (entity.physicalAddress) score += 10;
    if (locations === 1) score += 8;
  }

  if (!entity.physicalAddress) score -= 20;
  if (entity.status !== 'ACTIVE') score -= 30;

  return Math.min(Math.max(score, 0), 100);
}
