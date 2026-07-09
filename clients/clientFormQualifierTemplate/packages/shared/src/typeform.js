function asString(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export function normalizePurchaseTimeline(input) {
  const s = asString(input).trim().toLowerCase();
  if (!s) return 'unknown';

  if (s.includes('immediate') || s === 'now') return 'immediately';
  if (s.includes('30') || s.includes('within 30') || s.includes('0-30')) return 'within_30_days';
  if (s.includes('1') && s.includes('3') && s.includes('month')) return '1_3_months';
  if (s.includes('>') && s.includes('3') && s.includes('month')) return 'over_3_months';
  if (s.includes('over') && s.includes('3') && s.includes('month')) return 'over_3_months';
  if (s.includes('more than') && s.includes('3') && s.includes('month')) return 'over_3_months';

  return 'unknown';
}

export function parseBudgetToMonthlyUsd(input) {
  const s = asString(input).replace(/[, ]/g, '').toLowerCase();
  if (!s) return null;

  // Examples: "$500", "500", "500/mo", "500permonth"
  const m = s.match(/(\d{1,6})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

