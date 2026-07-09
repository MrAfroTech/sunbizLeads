const parseNum = (v) => parseFloat(v) || 0;

function moneyCard(id, indexLabel, title, descriptor, amount, formatMoney, spanFull = false) {
  return {
    id,
    indexLabel,
    title,
    descriptor,
    amount,
    formatAmount: formatMoney,
    spanFull,
  };
}

function countCard(id, indexLabel, title, descriptor, amount, spanFull = false) {
  return {
    id,
    indexLabel,
    title,
    descriptor,
    amount,
    formatAmount: (n) => Math.round(n).toLocaleString('en-US'),
    spanFull,
  };
}

// ——— Restaurants ———

export function computeRestaurants2Metrics({ peakCovers, avgSpend, reorderDropRate }) {
  const covers = parseNum(peakCovers);
  const spend = parseNum(avgSpend);
  const drop = parseNum(reorderDropRate);
  const missedPerShift = covers * (drop / 100) * spend * 0.55;
  const monthly_loss = missedPerShift * 26;
  const annual_loss = monthly_loss * 12;
  return {
    peakCovers: covers,
    avgSpend: spend,
    reorderDropRate: drop,
    missedPerShift,
    monthly_loss,
    annual_loss,
    recovery_10: annual_loss * 0.1,
    recovery_25: annual_loss * 0.25,
  };
}

export function buildRestaurants2LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    countCard('per-shift', 'Per shift', 'Covers lost to reorder friction', 'Guests who skip round two', metrics.peakCovers * (metrics.reorderDropRate / 100)),
    moneyCard('shift', 'Per shift', 'Reorder revenue missed', 'On a typical peak night', metrics.missedPerShift, formatMoney),
    moneyCard('monthly', 'Monthly', 'Monthly reorder gap', 'Across peak service nights', metrics.monthly_loss, formatMoney),
    moneyCard('recovery-10', '10% lift', 'Recovered at 10% improvement', 'Faster reorder cycles', metrics.recovery_10, formatMoney),
    moneyCard('recovery-25', '25% lift', 'Recovered at 25% improvement', 'Full second-round capture', metrics.recovery_25, formatMoney, true),
  ];
}

export function computeRestaurants3Metrics({ monthlyGuests, avgSpend, returnRate, visitsBeforeChurn }) {
  const guests = parseNum(monthlyGuests);
  const spend = parseNum(avgSpend);
  const rate = parseNum(returnRate);
  const visits = parseNum(visitsBeforeChurn);
  const lapsed = guests * ((100 - rate) / 100);
  const monthly_loss = lapsed * spend;
  const annual_loss = monthly_loss * 12;
  const lifetime_loss = annual_loss * visits;
  return {
    monthlyGuests: guests,
    avgSpend: spend,
    returnRate: rate,
    visitsBeforeChurn: visits,
    lapsed,
    monthly_loss,
    annual_loss,
    lifetime_loss,
    recovery_1: guests * 0.01 * spend * 12,
    recovery_5: guests * 0.05 * spend * 12,
  };
}

export function buildRestaurants3LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    countCard('lapsed', 'Headcount', 'Guests not returning monthly', 'One-time visitors replacing regulars', metrics.lapsed),
    moneyCard('monthly', 'Monthly', 'Repeat revenue walking out', 'Per month at current return rate', metrics.monthly_loss, formatMoney),
    moneyCard('annual', 'Annual', 'Annual repeat guest gap', 'What lapsed regulars cost per year', metrics.annual_loss, formatMoney),
    moneyCard('lifetime', 'Lifetime', 'Lifetime value at risk', 'Across average tenure', metrics.lifetime_loss, formatMoney),
    moneyCard('recovery-5', '5% lift', 'Recovered at 5% return lift', 'Bringing regulars back', metrics.recovery_5, formatMoney, true),
  ];
}

// ——— Hotels ———

export function computeHotels2Metrics({ guestsPerNight, roomServiceRate, avgOrder, occupiedNights }) {
  const guests = parseNum(guestsPerNight);
  const rate = parseNum(roomServiceRate);
  const order = parseNum(avgOrder);
  const nights = parseNum(occupiedNights);
  const industryRate = 11;
  const gapRate = Math.max(industryRate - rate, 0) / 100;
  const missedPerNight = guests * gapRate * order;
  const monthly_loss = missedPerNight * nights;
  const annual_loss = monthly_loss * 12;
  return {
    guestsPerNight: guests,
    roomServiceRate: rate,
    avgOrder: order,
    occupiedNights: nights,
    missedPerNight,
    monthly_loss,
    annual_loss,
    recovery_to_benchmark: guests * (industryRate / 100) * order * nights * 12 * 0.45,
  };
}

export function buildHotels2LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    moneyCard('night', 'Per night', 'Room service gap', 'Below industry capture benchmark', metrics.missedPerNight, formatMoney),
    moneyCard('monthly', 'Monthly', 'Monthly in-room order gap', 'Across occupied nights', metrics.monthly_loss, formatMoney),
    moneyCard('annual', 'Annual', 'Annual room service leakage', 'Orders never placed', metrics.annual_loss, formatMoney),
    moneyCard('recovery', 'Recovery', 'Recoverable with targeted offers', 'Up to 45% of the gap', metrics.recovery_to_benchmark, formatMoney, true),
  ];
}

export function computeHotels3Metrics({ guestsPerNight, amenityRate, avgAmenitySpend, occupiedNights }) {
  const guests = parseNum(guestsPerNight);
  const rate = parseNum(amenityRate);
  const spend = parseNum(avgAmenitySpend);
  const nights = parseNum(occupiedNights);
  const industryRate = 19;
  const gapRate = Math.max(industryRate - rate, 0) / 100;
  const missedPerNight = guests * gapRate * spend;
  const monthly_loss = missedPerNight * nights;
  const annual_loss = monthly_loss * 12;
  return {
    guestsPerNight: guests,
    amenityRate: rate,
    avgAmenitySpend: spend,
    occupiedNights: nights,
    missedPerNight,
    monthly_loss,
    annual_loss,
    recovery_to_benchmark: guests * (industryRate / 100) * spend * nights * 12 * 0.45,
  };
}

export function buildHotels3LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    moneyCard('night', 'Per night', 'Amenity upsell gap', 'Pool, spa, and paid extras missed', metrics.missedPerNight, formatMoney),
    moneyCard('monthly', 'Monthly', 'Monthly ancillary gap', 'Across occupied nights', metrics.monthly_loss, formatMoney),
    moneyCard('annual', 'Annual', 'Annual amenity leakage', 'Uncaptured on-property spend', metrics.annual_loss, formatMoney),
    moneyCard('recovery', 'Recovery', 'Recoverable ancillary revenue', 'Targeted on-property offers', metrics.recovery_to_benchmark, formatMoney, true),
  ];
}

// ——— Districts ———

export function computeDistricts2Metrics({ memberBusinesses, friSatFootTraffic, currentLiftPct }) {
  const businesses = parseNum(memberBusinesses);
  const traffic = parseNum(friSatFootTraffic);
  const current = parseNum(currentLiftPct);
  const benchmark = 23;
  const liftGap = Math.max(benchmark - current, 0) / 100;
  const avgSpend = 34;
  const weekendDays = 104;
  const corridor_gap = businesses * traffic * avgSpend * liftGap * weekendDays * 0.6;
  return {
    memberBusinesses: businesses,
    friSatFootTraffic: traffic,
    currentLiftPct: current,
    corridor_gap,
    per_weekend: corridor_gap / weekendDays,
    recovery_half: corridor_gap * 0.5,
    recovery_full: corridor_gap,
  };
}

export function buildDistricts2LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    moneyCard('weekend', 'Per weekend', 'Corridor lift gap', 'Below mobile-ordering benchmark', metrics.per_weekend, formatMoney),
    moneyCard('annual', 'Annual', 'Member business lift gap', 'Coordinated ordering upside', metrics.corridor_gap, formatMoney),
    moneyCard('half', '50% close', 'Recovered at half the gap', 'Partial district rollout', metrics.recovery_half, formatMoney),
    moneyCard('full', 'Full lift', 'Recovered at benchmark lift', '23% documented gross sales lift', metrics.recovery_full, formatMoney, true),
  ];
}

export function computeDistricts3Metrics({ programmingWeekends, avgAttendance, spendPerHead, captureRate }) {
  const weekends = parseNum(programmingWeekends);
  const attendance = parseNum(avgAttendance);
  const spend = parseNum(spendPerHead);
  const capture = parseNum(captureRate);
  const targetCapture = 72;
  const gap = Math.max(targetCapture - capture, 0) / 100;
  const per_event_gap = attendance * spend * gap;
  const annual_gap = per_event_gap * weekends;
  return {
    programmingWeekends: weekends,
    avgAttendance: attendance,
    spendPerHead: spend,
    captureRate: capture,
    per_event_gap,
    annual_gap,
    recovery_10: annual_gap * 0.1,
    recovery_25: annual_gap * 0.25,
  };
}

export function buildDistricts3LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    moneyCard('event', 'Per event', 'Programming capture gap', 'Spend left on the corridor', metrics.per_event_gap, formatMoney),
    moneyCard('annual', 'Annual', 'Anchor event ROI gap', 'Across programming weekends', metrics.annual_gap, formatMoney),
    moneyCard('recovery-10', '10% lift', 'Recovered at 10% capture lift', 'Better event-day conversion', metrics.recovery_10, formatMoney),
    moneyCard('recovery-25', '25% lift', 'Recovered at 25% capture lift', 'Full programming payoff', metrics.recovery_25, formatMoney, true),
  ];
}

// ——— Events ———

export function computeEvents2Metrics({ eventsPerYear, avgEventFee, vipSharePct, vipMissRate }) {
  const events = parseNum(eventsPerYear);
  const fee = parseNum(avgEventFee);
  const vipShare = parseNum(vipSharePct);
  const missRate = parseNum(vipMissRate);
  const vip_events = events * (vipShare / 100);
  const at_risk_fee = vip_events * fee * (missRate / 100);
  const referral_risk = at_risk_fee * 0.6;
  const annual_gap = at_risk_fee + referral_risk;
  return {
    eventsPerYear: events,
    avgEventFee: fee,
    vipSharePct: vipShare,
    vipMissRate: missRate,
    at_risk_fee,
    referral_risk,
    annual_gap,
    recovery_half: annual_gap * 0.5,
  };
}

export function buildEvents2LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    countCard('vip-events', 'VIP events', 'Events with VIP exposure', 'Where recognition matters most', metrics.eventsPerYear * (metrics.vipSharePct / 100)),
    moneyCard('fee-risk', 'Fee risk', 'Event fee value at risk', 'When VIPs go unrecognized', metrics.at_risk_fee, formatMoney),
    moneyCard('referral', 'Referrals', 'Referral pipeline at risk', '60% of planner revenue from repeats', metrics.referral_risk, formatMoney),
    moneyCard('recovery', 'Recovery', 'Recoverable with guest handoff', 'Closing the VIP recognition gap', metrics.recovery_half, formatMoney, true),
  ];
}

export function computeEvents3Metrics({ eventsPerYear, avgEventFee, referralRate, referralDropPct }) {
  const events = parseNum(eventsPerYear);
  const fee = parseNum(avgEventFee);
  const referral = parseNum(referralRate);
  const drop = parseNum(referralDropPct);
  const referral_revenue = events * fee * (referral / 100);
  const annual_gap = referral_revenue * (drop / 100);
  const lifetime_gap = annual_gap * 3;
  return {
    eventsPerYear: events,
    avgEventFee: fee,
    referralRate: referral,
    referralDropPct: drop,
    referral_revenue,
    annual_gap,
    lifetime_gap,
    recovery_5: annual_gap * 0.05,
    recovery_15: annual_gap * 0.15,
  };
}

export function buildEvents3LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    moneyCard('referral-base', 'Referral base', 'Planner-driven revenue', 'Repeat and referral bookings', metrics.referral_revenue, formatMoney),
    moneyCard('annual', 'Annual', 'Referral pipeline gap', 'Follow-up and handoff leakage', metrics.annual_gap, formatMoney),
    moneyCard('lifetime', '3-year', 'Multi-year referral loss', 'Compounding planner churn', metrics.lifetime_gap, formatMoney),
    moneyCard('recovery-15', '15% lift', 'Recovered at 15% referral lift', 'Stronger post-event follow-up', metrics.recovery_15, formatMoney, true),
  ];
}

// ——— Festivals ———

export function computeFestivalsMetrics({ dailyAttendance, vendorStalls, walkawayRate }) {
  const attendance = parseNum(dailyAttendance);
  const stalls = parseNum(vendorStalls);
  const walkaway = parseNum(walkawayRate);
  const avgSpend = 28;
  const walkaways = attendance * (walkaway / 100);
  const daily_loss = walkaways * avgSpend;
  const annual_loss = daily_loss * 12;
  return {
    dailyAttendance: attendance,
    vendorStalls: stalls,
    walkawayRate: walkaway,
    walkaways,
    daily_loss,
    annual_loss,
    recovery_20: annual_loss * 0.2,
  };
}

export function buildFestivalsLockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    countCard('walkaways', 'Per day', 'Attendees skipping vendor lines', 'Queue abandonment', metrics.walkaways),
    moneyCard('daily', 'Per day', 'Vendor revenue walked away', 'On a typical festival day', metrics.daily_loss, formatMoney),
    moneyCard('annual', 'Annual', 'Annual vendor queue gap', 'Across event days', metrics.annual_loss, formatMoney),
    moneyCard('recovery', '20% lift', 'Recovered with mobile ordering', 'Documented festival lift', metrics.recovery_20, formatMoney, true),
  ];
}

export function computeFestivals2Metrics({ dailyAttendance, merchConversion, avgMerchOrder }) {
  const attendance = parseNum(dailyAttendance);
  const conversion = parseNum(merchConversion);
  const order = parseNum(avgMerchOrder);
  const industryConversion = 22;
  const gap = Math.max(industryConversion - conversion, 0) / 100;
  const missed_orders = attendance * gap;
  const daily_loss = missed_orders * order;
  const annual_loss = daily_loss * 12;
  return {
    dailyAttendance: attendance,
    merchConversion: conversion,
    avgMerchOrder: order,
    missed_orders,
    daily_loss,
    annual_loss,
    impulse_recovery: annual_loss * 0.25,
  };
}

export function buildFestivals2LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    countCard('missed', 'Per day', 'Impulse merch orders missed', 'Queue friction kills impulse', metrics.missed_orders),
    moneyCard('daily', 'Per day', 'Daily merch gap', 'Lost impulse purchases', metrics.daily_loss, formatMoney),
    moneyCard('annual', 'Annual', 'Annual merch leakage', 'Across festival days', metrics.annual_loss, formatMoney),
    moneyCard('recovery', '25% lift', 'Recovered impulse capture', 'QR pay-and-pickup flow', metrics.impulse_recovery, formatMoney, true),
  ];
}

export function computeFestivals3Metrics({ dailyAttendance, targetSpend, actualSpend, eventDays }) {
  const attendance = parseNum(dailyAttendance);
  const target = parseNum(targetSpend);
  const actual = parseNum(actualSpend);
  const days = parseNum(eventDays);
  const gapPerHead = Math.max(target - actual, 0);
  const daily_loss = attendance * gapPerHead;
  const annual_loss = daily_loss * days;
  return {
    dailyAttendance: attendance,
    targetSpend: target,
    actualSpend: actual,
    eventDays: days,
    gapPerHead,
    daily_loss,
    annual_loss,
    recovery_15: annual_loss * 0.15,
    recovery_30: annual_loss * 0.3,
  };
}

export function buildFestivals3LockedCards(metrics, formatMoney) {
  if (!metrics) return [];
  return [
    moneyCard('per-head', 'Per head', 'Per-attendee spend gap', 'Below capture target', metrics.gapPerHead, formatMoney),
    moneyCard('daily', 'Per day', 'Daily per-head leakage', 'Attendance × spend gap', metrics.daily_loss, formatMoney),
    moneyCard('annual', 'Season', 'Full run capture gap', 'Across all event days', metrics.annual_loss, formatMoney),
    moneyCard('recovery-30', '30% lift', 'Recovered capture lift', 'Organized vendor experience', metrics.recovery_30, formatMoney, true),
  ];
}
