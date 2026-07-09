/** Gross sales lift from mobile ordering availability (documented benchmark). */
export const MOBILE_ORDERING_LIFT_RATE = 0.23;

/** Fri + Sat modeled across 52 weeks. */
export const WEEKEND_DAYS_PER_YEAR = 104;

/** Applied to raw projection so coordinators see a defensible number. */
export const CONSERVATIVE_DISCOUNT = 0.6;

/** Hidden constant — not shown in UI. */
export const AVG_SPEND_PER_VISITOR = 34;

export const DISTRICT_TYPE_OPTIONS = [
  'Entertainment District',
  'Historic Downtown',
  'Arts & Culture District',
  'Market District',
  'Sports & Event District',
];

/** Six district types — even grid for hero-layout calculators. */
export const HERO_DISTRICT_TYPE_OPTIONS = [
  'Entertainment District',
  'Historic Downtown',
  'Arts & Culture District',
  'Market District',
  'Sports & Event District',
  'Mixed-use urban district',
];

export const EVENT_FREQUENCY_OPTIONS = [
  'Daily foot traffic corridor (no anchor events)',
  '1–2 events per month',
  'Weekly programming',
  '2–3x per week',
];

export const DISTRICT_TYPE_MULTIPLIERS = {
  'Entertainment District': 1.0,
  'Sports & Event District': 1.15,
  'Historic Downtown': 0.8,
  'Arts & Culture District': 0.75,
  'Market District': 0.85,
  'Mixed-use urban district': 0.9,
};

export const EVENT_FREQUENCY_MULTIPLIERS = {
  'Daily foot traffic corridor (no anchor events)': 1.0,
  '1–2 events per month': 1.1,
  'Weekly programming': 1.25,
  '2–3x per week': 1.4,
};

export function districtTypeMultiplier(districtType) {
  return DISTRICT_TYPE_MULTIPLIERS[districtType] ?? 1;
}

export function eventFrequencyMultiplier(eventFrequency) {
  return EVENT_FREQUENCY_MULTIPLIERS[eventFrequency] ?? 1;
}

/**
 * Corridor-level revenue lift for district coordinators.
 * @returns {{
 *   memberBusinesses: number,
 *   friSatFootTraffic: number,
 *   districtType: string,
 *   eventFrequency: string,
 *   rawAnnualLift: number,
 *   corridorAnnualLift: number,
 *   corridorLiftPerWeekend: number,
 * }}
 */
export function computeDistrictCalculatorMetrics({
  districtType,
  eventFrequency,
  memberBusinesses,
  friSatFootTraffic,
}) {
  const businesses = parseFloat(memberBusinesses) || 0;
  const footTraffic = parseFloat(friSatFootTraffic) || 0;
  const districtMult = districtTypeMultiplier(districtType);
  const eventMult = eventFrequencyMultiplier(eventFrequency);

  const rawAnnualLift =
    businesses *
    footTraffic *
    AVG_SPEND_PER_VISITOR *
    MOBILE_ORDERING_LIFT_RATE *
    WEEKEND_DAYS_PER_YEAR *
    districtMult *
    eventMult;

  const corridorAnnualLift = rawAnnualLift * CONSERVATIVE_DISCOUNT;
  const corridorLiftPerWeekend = corridorAnnualLift / 52;

  return {
    memberBusinesses: businesses,
    friSatFootTraffic: footTraffic,
    districtType,
    eventFrequency,
    rawAnnualLift,
    corridorAnnualLift,
    corridorLiftPerWeekend,
  };
}
