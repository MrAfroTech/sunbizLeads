export const formatRangeCurrency = (value) =>
  `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export const formatRangeNumber = (value) =>
  Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const formatRangePercent = (value) => `${Number(value)}%`;

export const formatRangeYears = (value) => {
  const n = Number(value);
  return Number.isInteger(n) ? `${n} yrs` : `${n.toFixed(1)} yrs`;
};

export const formatRangeDays = (value) =>
  `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })} days`;

export function getRangeDefaultValue({ min, max, step }) {
  const mid = (min + max) / 2;
  const steps = Math.round((mid - min) / step);
  return min + steps * step;
}

export const CALCULATOR_RANGE_FIELDS = {
  peakAttendance: {
    min: 100,
    max: 10000,
    step: 100,
    formatValue: formatRangeNumber,
  },
  averageSpend: {
    min: 5,
    max: 200,
    step: 1,
    formatValue: formatRangeCurrency,
  },
  nightlyRate: {
    min: 50,
    max: 1000,
    step: 10,
    formatValue: formatRangeCurrency,
  },
  guestsPerNight: {
    min: 10,
    max: 2000,
    step: 10,
    formatValue: formatRangeNumber,
  },
  eventsPerYear: {
    min: 1,
    max: 200,
    step: 1,
    formatValue: formatRangeNumber,
  },
  avgEventFee: {
    min: 500,
    max: 50000,
    step: 500,
    formatValue: formatRangeCurrency,
  },
  memberBusinesses: {
    min: 5,
    max: 500,
    step: 5,
    formatValue: formatRangeNumber,
  },
  footTraffic: {
    min: 100,
    max: 50000,
    step: 100,
    formatValue: formatRangeNumber,
  },
  seasonTickets: {
    min: 100,
    max: 20000,
    step: 100,
    formatValue: formatRangeNumber,
  },
  ticketPackage: {
    min: 100,
    max: 10000,
    step: 100,
    formatValue: formatRangeCurrency,
  },
  renewalRate: {
    min: 1,
    max: 100,
    step: 1,
    formatValue: formatRangePercent,
  },
  tenureYears: {
    min: 1,
    max: 20,
    step: 0.5,
    formatValue: formatRangeYears,
  },
  sponsorshipRevenue: {
    min: 10000,
    max: 5000000,
    step: 10000,
    formatValue: formatRangeCurrency,
  },
  sponsorCount: {
    min: 1,
    max: 200,
    step: 1,
    formatValue: formatRangeNumber,
  },
  activationFulfillment: {
    min: 1,
    max: 100,
    step: 1,
    formatValue: formatRangePercent,
  },
  renewalSensitivity: {
    min: 1,
    max: 100,
    step: 1,
    formatValue: formatRangePercent,
  },
  turnoverPerMonth: {
    min: 1,
    max: 50,
    step: 1,
    formatValue: formatRangeNumber,
  },
  tenureDays: {
    min: 30,
    max: 1825,
    step: 30,
    formatValue: formatRangeDays,
  },
};

const FORK_FIELD_RANGE_BY_ID = {
  peakCovers: 'peakAttendance',
  avgSpend: 'averageSpend',
  monthlyGuests: 'peakAttendance',
  guestsPerNight: 'guestsPerNight',
  avgOrder: 'averageSpend',
  avgAmenitySpend: 'averageSpend',
  memberBusinesses: 'memberBusinesses',
  friSatFootTraffic: 'footTraffic',
  avgAttendance: 'peakAttendance',
  spendPerHead: 'averageSpend',
  eventsPerYear: 'eventsPerYear',
  avgEventFee: 'avgEventFee',
  dailyAttendance: 'peakAttendance',
  vendorStalls: 'memberBusinesses',
  avgMerchOrder: 'averageSpend',
  targetSpend: 'averageSpend',
  actualSpend: 'averageSpend',
  eventDays: 'eventsPerYear',
  programmingWeekends: 'eventsPerYear',
  occupiedNights: 'eventsPerYear',
  visitsBeforeChurn: 'eventsPerYear',
};

export function getForkStepRangeProps(step) {
  if (step.inputType === 'range') {
    return {
      min: step.min ?? 1,
      max: step.max ?? 100,
      step: step.step ?? 1,
      formatValue: formatRangePercent,
    };
  }

  const mapped = FORK_FIELD_RANGE_BY_ID[step.id];
  if (mapped && CALCULATOR_RANGE_FIELDS[mapped]) {
    return CALCULATOR_RANGE_FIELDS[mapped];
  }

  const min = step.min ?? 1;
  const defaultNum = Number(step.defaultValue);
  const isCurrency = /spend|fee|order|revenue|target|actual|merch|amenity/i.test(step.id);

  return {
    min,
    max: step.max ?? Math.max(defaultNum * 25, min + 500, 1000),
    step: step.step ?? 1,
    formatValue: isCurrency ? formatRangeCurrency : formatRangeNumber,
  };
}
