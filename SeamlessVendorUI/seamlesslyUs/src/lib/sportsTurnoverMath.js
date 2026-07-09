const HOURS_PER_YEAR = 2080;
const REPLACEMENT_COST_RATE = 0.33;
const COMPOUND_RATE = 1.15;

export function computeSportsTurnoverMetrics({ staffCount, hourlyWage, turnoverRatePct }) {
  const staff = parseFloat(staffCount) || 0;
  const wage = parseFloat(hourlyWage) || 0;
  const rate = parseFloat(turnoverRatePct) || 0;

  const employeesLost = staff * (rate / 100);
  const costPerEmployee = wage * HOURS_PER_YEAR * REPLACEMENT_COST_RATE;
  const totalAnnual = employeesLost * costPerEmployee;
  const year1 = totalAnnual;
  const year2 = year1 * COMPOUND_RATE;
  const year3 = year1 * COMPOUND_RATE * COMPOUND_RATE;
  const threeYear = year1 + year2 + year3;
  const monthly = totalAnnual / 12;

  return {
    employeesLost,
    costPerEmployee,
    totalAnnual,
    threeYear,
    monthly,
  };
}

export function turnoverMetricsToSearchParams(metrics) {
  const qs = new URLSearchParams();
  qs.set('employees_lost', String(metrics.employeesLost));
  qs.set('cost_per_employee', String(metrics.costPerEmployee));
  qs.set('total_annual', String(metrics.totalAnnual));
  qs.set('three_year', String(metrics.threeYear));
  qs.set('monthly', String(metrics.monthly));
  return qs;
}

export function parseTurnoverMetricsFromSearchParams(searchParams) {
  const get = (key) => parseFloat(searchParams.get(key)) || 0;
  return {
    employeesLost: get('employees_lost'),
    costPerEmployee: get('cost_per_employee'),
    totalAnnual: get('total_annual'),
    threeYear: get('three_year'),
    monthly: get('monthly'),
  };
}
