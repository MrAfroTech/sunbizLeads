export function computeSports2RetentionMetrics({
  totalSeasonTickets,
  avgTicketPackageValue,
  currentRenewalRate,
  avgTenureYears,
}) {
  const tickets = parseFloat(totalSeasonTickets) || 0;
  const packageValue = parseFloat(avgTicketPackageValue) || 0;
  const renewalRate = parseFloat(currentRenewalRate) || 0;
  const tenure = parseFloat(avgTenureYears) || 0;

  const lapsed_holders = tickets * ((100 - renewalRate) / 100);
  const annual_revenue_lost = lapsed_holders * packageValue;
  const lifetime_value_lost = annual_revenue_lost * tenure;
  const cost_per_lapsed_holder =
    lapsed_holders > 0 ? lifetime_value_lost / lapsed_holders : 0;
  const one_percent_recovery = tickets * 0.01 * packageValue;
  const five_percent_recovery = tickets * 0.05 * packageValue;

  return {
    totalSeasonTickets: tickets,
    avgTicketPackageValue: packageValue,
    currentRenewalRate: renewalRate,
    avgTenureYears: tenure,
    lapsed_holders,
    annual_revenue_lost,
    lifetime_value_lost,
    cost_per_lapsed_holder,
    one_percent_recovery,
    five_percent_recovery,
  };
}

export function buildSports2LockedCards(metrics, formatMoney) {
  if (!metrics) return [];

  return [
    {
      id: 'lapsed',
      indexLabel: 'Headcount',
      title: 'Holders lost this season',
      descriptor: 'Non-renewal headcount',
      amount: metrics.lapsed_holders,
      formatAmount: (n) => Math.round(n).toLocaleString('en-US'),
    },
    {
      id: 'ltv-per',
      indexLabel: 'Per holder',
      title: 'Lifetime value per lapsed holder',
      descriptor: 'What each relationship was worth',
      amount: metrics.cost_per_lapsed_holder,
      formatAmount: formatMoney,
    },
    {
      id: 'ltv-total',
      indexLabel: 'Lifetime',
      title: 'Total lifetime revenue walking out',
      descriptor: 'Across all non-renewals',
      amount: metrics.lifetime_value_lost,
      formatAmount: formatMoney,
    },
    {
      id: 'recovery-1',
      indexLabel: '1% lift',
      title: 'Revenue recovered at 1% improvement',
      descriptor: 'What fixing retention by 1% returns',
      amount: metrics.one_percent_recovery,
      formatAmount: formatMoney,
    },
    {
      id: 'recovery-5',
      indexLabel: '5% lift',
      title: 'Revenue recovered at 5% improvement',
      descriptor: 'The upside of a real retention program',
      amount: metrics.five_percent_recovery,
      formatAmount: formatMoney,
      spanFull: true,
    },
  ];
}
