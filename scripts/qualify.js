/**
 * Qualification scoring — registry data only (no Places).
 * Reweighted so leads can qualify on recency + address alone (no location/dba data).
 */

export function scoreEntity(entity, layer) {
  let score = 50;

  const filingDate = entity.filingDate ? new Date(entity.filingDate) : null;
  const ageMonths = filingDate
    ? (Date.now() - filingDate.getTime()) / (30 * 86400000)
    : 999;

  if (layer === 'est') {
    if (ageMonths <= 12) score += 25;
    else if (ageMonths <= 24) score += 15;
    else if (ageMonths <= 36) score += 8;
    if (entity.physicalAddress) score += 15;
    if ((entity.status || '').toUpperCase() === 'ACTIVE') score += 10;
  }

  if (layer === 'new') {
    if (ageMonths <= 6) score += 30;
    else if (ageMonths <= 12) score += 20;
    else if (ageMonths <= 18) score += 10;
    if (entity.physicalAddress) score += 15;
  }

  if (!entity.physicalAddress) score -= 20;
  if ((entity.status || '').toUpperCase() !== 'ACTIVE') score -= 30;

  return Math.min(Math.max(score, 0), 100);
}
