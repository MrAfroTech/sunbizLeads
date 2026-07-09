const VENUE_TYPES = ['Stadium', 'Bar', 'QSR', 'Food Truck', 'Festival', 'District'];

const DEPLOYMENT_BLUEPRINTS = {
  Stadium: 'Start with concourse zones, then seat-back QR, then suite/VIP',
  Bar: 'Start with bar top, then table tents, then patio',
  QSR: 'Start with entry door, then counter face, then window',
  'Food Truck': 'Start with A-frame sign, then truck side panel, then ground decals',
  Festival: 'Start with queue-line signage, then ground decals, then vendor kits',
  District: 'Start with light pole signage, then sidewalk decals, then venue frontage',
};

const BENCHMARK_PER_SCAN = {
  Stadium: 4.2,
  Bar: 2.8,
  QSR: 3.1,
  'Food Truck': 2.4,
  Festival: 3.6,
  District: 2.2,
};

const OPPORTUNITY_TEMPLATES = {
  Stadium: [
    { id: 'concourse', label: 'Concourse high-traffic QR zones', weight: 0.38 },
    { id: 'seatback', label: 'In-seat ordering (sections & suites)', weight: 0.32 },
    { id: 'queue', label: 'Express concession queue bypass', weight: 0.22 },
    { id: 'halftime', label: 'Halftime rush pre-order capture', weight: 0.18 },
    { id: 'vip', label: 'Suite & VIP frictionless tabs', weight: 0.15 },
  ],
  Bar: [
    { id: 'bar-top', label: 'Bar-top scan-to-order rails', weight: 0.36 },
    { id: 'table', label: 'Table tent QR ordering', weight: 0.3 },
    { id: 'patio', label: 'Patio & overflow seating capture', weight: 0.24 },
    { id: 'happy-hour', label: 'Peak-hour line compression', weight: 0.2 },
    { id: 'tabs', label: 'Open-tab digital upsells', weight: 0.16 },
  ],
  QSR: [
    { id: 'entry', label: 'Entry door menu & order-ahead', weight: 0.35 },
    { id: 'counter', label: 'Counter-face QR upsell panels', weight: 0.32 },
    { id: 'window', label: 'Pickup window express lane', weight: 0.26 },
    { id: 'drive', label: 'Drive-thru handoff optimization', weight: 0.2 },
    { id: 'loyalty', label: 'Repeat-visit loyalty capture', weight: 0.14 },
  ],
  'Food Truck': [
    { id: 'aframe', label: 'A-frame approach signage', weight: 0.34 },
    { id: 'panel', label: 'Truck side panel QR menus', weight: 0.3 },
    { id: 'decals', label: 'Ground decals in queue zone', weight: 0.24 },
    { id: 'event', label: 'Event foot-traffic pre-order', weight: 0.2 },
    { id: 'pickup', label: 'Window pickup express flow', weight: 0.15 },
  ],
  Festival: [
    { id: 'queue-sign', label: 'Queue-line signage & menus', weight: 0.37 },
    { id: 'decals', label: 'Ground decals in common areas', weight: 0.3 },
    { id: 'vendor-kits', label: 'Vendor kit deployment bundles', weight: 0.25 },
    { id: 'gates', label: 'Gate & entry pre-order capture', weight: 0.2 },
    { id: 'lawn', label: 'Lawn seating order-ahead', weight: 0.16 },
  ],
  District: [
    { id: 'poles', label: 'Light pole district signage', weight: 0.35 },
    { id: 'sidewalk', label: 'Sidewalk decal wayfinding', weight: 0.3 },
    { id: 'frontage', label: 'Venue frontage QR entry points', weight: 0.26 },
    { id: 'patio', label: 'Shared patio ordering hubs', weight: 0.2 },
    { id: 'pickup', label: 'District-wide pickup coordination', weight: 0.15 },
  ],
};

export function normalizeVenueType(venueType) {
  const raw = (venueType || 'Stadium').trim();
  if (VENUE_TYPES.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower.includes('stadium') || lower.includes('arena') || lower.includes('sport')) return 'Stadium';
  if (lower.includes('bar')) return 'Bar';
  if (lower.includes('qsr') || lower.includes('quick')) return 'QSR';
  if (lower.includes('truck')) return 'Food Truck';
  if (lower.includes('festival') || lower.includes('event')) return 'Festival';
  if (lower.includes('district') || lower.includes('main street')) return 'District';
  return 'Stadium';
}

export function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCurrencyDec(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Annual missed revenue uplift potential (20% volume increase × 365 days). */
export function computeAnnualMissedRevenue(dailyCovers, avgOrderValue) {
  const covers = Number(dailyCovers) || 0;
  const aov = Number(avgOrderValue) || 0;
  return covers * aov * 0.2 * 365;
}

export function computePriorityOpportunities(venueType, dailyCovers, avgOrderValue) {
  const type = normalizeVenueType(venueType);
  const base = OPPORTUNITY_TEMPLATES[type] || OPPORTUNITY_TEMPLATES.Stadium;
  const annualBase = computeAnnualMissedRevenue(dailyCovers, avgOrderValue);

  return [...base]
    .map((item) => ({
      ...item,
      estimatedImpact: annualBase * item.weight,
    }))
    .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
    .slice(0, 3)
    .map((item, index) => ({
      rank: index + 1,
      label: item.label,
      estimatedImpact: item.estimatedImpact,
      estimatedImpactFormatted: formatCurrency(item.estimatedImpact),
    }));
}

export function computeRoiTimeline(dailyCovers, avgOrderValue) {
  const totalRecoverable = computeAnnualMissedRevenue(dailyCovers, avgOrderValue);
  const months = [];
  for (let month = 1; month <= 6; month += 1) {
    const cumulative = (totalRecoverable / 6) * month;
    months.push({
      month,
      cumulative,
      cumulativeFormatted: formatCurrency(cumulative),
    });
  }
  return months;
}

export function computeBenchmark(venueType) {
  const type = normalizeVenueType(venueType);
  const industryAvg = BENCHMARK_PER_SCAN[type] ?? BENCHMARK_PER_SCAN.Stadium;
  return {
    venueType: type,
    industryAvgPerScan: industryAvg,
    industryAvgFormatted: formatCurrencyDec(industryAvg),
    yourBaseline: 0,
    yourBaselineFormatted: formatCurrencyDec(0),
  };
}

export function buildCalculatorPlusReport(inputs) {
  const venueType = normalizeVenueType(inputs.venueType);
  const dailyCovers = Number(inputs.dailyCovers) || 0;
  const avgOrderValue = Number(inputs.avgOrderValue) || 0;
  const missedRevenue = Number(inputs.missedRevenue) || 0;

  return {
    venueType,
    dailyCovers,
    avgOrderValue,
    missedRevenue,
    missedRevenueFormatted: formatCurrency(missedRevenue),
    annualMissedRevenue: computeAnnualMissedRevenue(dailyCovers, avgOrderValue),
    annualMissedRevenueFormatted: formatCurrency(
      computeAnnualMissedRevenue(dailyCovers, avgOrderValue)
    ),
    deploymentBlueprint: DEPLOYMENT_BLUEPRINTS[venueType],
    priorityOpportunities: computePriorityOpportunities(venueType, dailyCovers, avgOrderValue),
    roiTimeline: computeRoiTimeline(dailyCovers, avgOrderValue),
    benchmark: computeBenchmark(venueType),
  };
}

export { VENUE_TYPES, DEPLOYMENT_BLUEPRINTS, BENCHMARK_PER_SCAN };
