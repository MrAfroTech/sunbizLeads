export function computeSports3SponsorshipMetrics({
  totalSponsorshipRevenue,
  numSponsors,
  avgActivationFulfillment,
  renewalSensitivity,
}) {
  const totalRevenue = parseFloat(totalSponsorshipRevenue) || 0;
  const sponsors = parseFloat(numSponsors) || 0;
  const fulfillment = parseFloat(avgActivationFulfillment) || 0;
  const sensitivity = parseFloat(renewalSensitivity) || 0;

  const fulfillment_gap = (100 - fulfillment) / 100;
  const at_risk_sponsors = Math.round(sponsors * (sensitivity / 100));
  const revenue_per_sponsor = sponsors > 0 ? totalRevenue / sponsors : 0;
  const at_risk_revenue = at_risk_sponsors * revenue_per_sponsor;
  const activation_gap_cost = totalRevenue * fulfillment_gap;
  const full_portfolio_risk = at_risk_revenue + activation_gap_cost;
  const recovery_at_90_fulfillment =
    totalRevenue * 0.9 - totalRevenue * (fulfillment / 100);

  return {
    totalSponsorshipRevenue: totalRevenue,
    numSponsors: sponsors,
    avgActivationFulfillment: fulfillment,
    renewalSensitivity: sensitivity,
    fulfillment_gap,
    at_risk_sponsors,
    revenue_per_sponsor,
    at_risk_revenue,
    activation_gap_cost,
    full_portfolio_risk,
    recovery_at_90_fulfillment,
  };
}

export function buildSports3LockedCards(metrics, formatMoney) {
  if (!metrics) return [];

  return [
    {
      id: 'at-risk-sponsors',
      indexLabel: 'Renewal risk',
      title: 'Sponsors at risk of non-renewal',
      descriptor: 'Contacts who will ask for ROI proof',
      amount: metrics.at_risk_sponsors,
      formatAmount: (n) => Math.round(n).toLocaleString('en-US'),
    },
    {
      id: 'per-sponsor',
      indexLabel: 'Per sponsor',
      title: 'Revenue per sponsor',
      descriptor: 'What each relationship is worth annually',
      amount: metrics.revenue_per_sponsor,
      formatAmount: formatMoney,
    },
    {
      id: 'activation-gap',
      indexLabel: 'Fulfillment gap',
      title: 'Activation gap cost',
      descriptor: 'Revenue impact of unfulfilled deliverables',
      amount: metrics.activation_gap_cost,
      formatAmount: formatMoney,
    },
    {
      id: 'portfolio-risk',
      indexLabel: 'Combined risk',
      title: 'Full portfolio risk',
      descriptor: 'At-risk renewals + activation gap combined',
      amount: metrics.full_portfolio_risk,
      formatAmount: formatMoney,
    },
    {
      id: 'recovery-90',
      indexLabel: '90% target',
      title: 'Recovery at 90% fulfillment',
      descriptor: 'What closing the activation gap returns',
      amount: metrics.recovery_at_90_fulfillment,
      formatAmount: formatMoney,
      spanFull: true,
    },
  ];
}
