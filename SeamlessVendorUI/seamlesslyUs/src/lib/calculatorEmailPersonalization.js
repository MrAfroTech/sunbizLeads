import { computeLeakMomentAmounts } from './leakReportMoments';

export const HOSPITALITY_AVG_WAIT_TIME = '10 minutes';
export const CONCESSION_AVG_WAIT_TIME = '8 minutes';

function formatEstimatedLoss(amount) {
  const n = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function topLeakMomentName(metrics) {
  const moments = computeLeakMomentAmounts(metrics);
  if (!moments.length) return 'Wait to reorder';
  return moments.reduce((top, moment) =>
    (moment.amount || 0) > (top.amount || 0) ? moment : top
  ).name;
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildWaitCalculatorEmailFields(metrics) {
  const moments = computeLeakMomentAmounts(metrics);
  const total = moments.reduce((sum, moment) => sum + (moment.amount || 0), 0);

  return {
    estimated_loss: formatEstimatedLoss(total),
    avg_wait_time: HOSPITALITY_AVG_WAIT_TIME,
    primary_friction_zone: topLeakMomentName(metrics),
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildSportsGameEmailFields({ leftOnTable }) {
  return {
    estimated_loss: formatEstimatedLoss(leftOnTable),
    avg_wait_time: CONCESSION_AVG_WAIT_TIME,
    primary_friction_zone: 'Guests who never ordered during the event',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildEventEmailFields(metrics) {
  return {
    estimated_loss: formatEstimatedLoss(metrics?.total_gap || metrics?.revenueLeftOnTable || 0),
    avg_wait_time: HOSPITALITY_AVG_WAIT_TIME,
    primary_friction_zone: 'Guest intelligence gaps between brief and venue floor',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildHotelGuestSpendEmailFields(metrics) {
  return {
    estimated_loss: formatEstimatedLoss(metrics?.monthlyMissedRevenue || 0),
    avg_wait_time: HOSPITALITY_AVG_WAIT_TIME,
    primary_friction_zone: 'On-property ancillary spend gap',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildDistrictEmailFields(metrics) {
  return {
    estimated_loss: formatEstimatedLoss(metrics?.corridorAnnualLift || 0),
    avg_wait_time: HOSPITALITY_AVG_WAIT_TIME,
    primary_friction_zone: metrics?.districtType || 'District-wide mobile ordering gap',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildSportsTurnoverEmailFields(metrics) {
  return {
    estimated_loss: formatEstimatedLoss(metrics?.totalAnnual || 0),
    avg_wait_time: HOSPITALITY_AVG_WAIT_TIME,
    primary_friction_zone: 'Staff turnover and rehire cost',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildStaffBurnoutEmailFields(parsed) {
  return {
    estimated_loss: formatEstimatedLoss(parsed?.turnoverCost || 0),
    avg_wait_time: HOSPITALITY_AVG_WAIT_TIME,
    primary_friction_zone: 'Staff burnout and tenure extension',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildStaffTurnoverEmailFields(snapshot) {
  const annual = snapshot?.turnoverCost ?? (snapshot?.monthlyCost || 0) * 12;
  return {
    estimated_loss: formatEstimatedLoss(annual),
    avg_wait_time: HOSPITALITY_AVG_WAIT_TIME,
    primary_friction_zone: 'Staff turnover and rehire cost',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildMagicBandsEmailFields(parsed) {
  const total = (parsed?.amount || 0) + (parsed?.parkingLoss || 0);
  const zone =
    (parsed?.parkingLoss || 0) > 0
      ? 'Parking and entry friction'
      : 'Door and service-point friction';

  return {
    estimated_loss: formatEstimatedLoss(total),
    avg_wait_time: CONCESSION_AVG_WAIT_TIME,
    primary_friction_zone: zone,
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildSports2RetentionEmailFields(metrics) {
  return {
    estimated_loss: formatEstimatedLoss(metrics?.annual_revenue_lost || 0),
    avg_wait_time: CONCESSION_AVG_WAIT_TIME,
    primary_friction_zone: 'Season ticket renewal and retention gap',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildSports3SponsorshipEmailFields(metrics) {
  return {
    estimated_loss: formatEstimatedLoss(metrics?.full_portfolio_risk || 0),
    avg_wait_time: CONCESSION_AVG_WAIT_TIME,
    primary_friction_zone: 'Sponsorship activation and renewal risk',
  };
}

/** @returns {{ estimated_loss: string, avg_wait_time: string, primary_friction_zone: string }} */
export function buildForkEmailFields(metrics, frictionZone) {
  const loss =
    metrics?.annual_loss ??
    metrics?.annual_gap ??
    metrics?.corridor_gap ??
    metrics?.lifetime_loss ??
    metrics?.full_portfolio_risk ??
    0;

  return {
    estimated_loss: formatEstimatedLoss(loss),
    avg_wait_time: CONCESSION_AVG_WAIT_TIME,
    primary_friction_zone: frictionZone || 'Revenue capture gap',
  };
}

export function isCompleteCalculatorEmailFields(fields) {
  if (!fields || typeof fields !== 'object') return false;
  return ['estimated_loss', 'avg_wait_time', 'primary_friction_zone'].every((key) => {
    const value = fields[key];
    return typeof value === 'string' && value.trim() !== '';
  });
}
