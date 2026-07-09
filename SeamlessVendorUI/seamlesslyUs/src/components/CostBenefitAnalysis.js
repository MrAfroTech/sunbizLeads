import React, { useState, useMemo } from 'react';
import '../styles/ContentPage.css';
import '../styles/CostBenefitAnalysis.css';
import BookingModal from './BookingModal';

const CostBenefitAnalysis = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [customersPerHour, setCustomersPerHour] = useState('');
  const [avgOrderAmount, setAvgOrderAmount] = useState('');
  const [busyHoursPerWeek, setBusyHoursPerWeek] = useState('');
  // Walk-away rate % — placeholder/suggested range 10–20%; have someone who knows your customers' industry validate for the tool.
  const [walkAwayRate, setWalkAwayRate] = useState('');

  const results = useMemo(() => {
    const cust = parseFloat(customersPerHour) || 0;
    const order = parseFloat(avgOrderAmount) || 0;
    const hours = parseFloat(busyHoursPerWeek) || 0;
    const rate = parseFloat(walkAwayRate) || 0;
    if (cust <= 0 || order <= 0 || hours <= 0 || rate < 0) return null;

    const lostCustomersPerBusyHour = cust * (rate / 100);
    const lostRevenuePerBusyHour = lostCustomersPerBusyHour * order;
    const lostRevenuePerWeek = lostRevenuePerBusyHour * hours;
    const lostRevenuePerMonth = lostRevenuePerWeek * 4.3;
    const lostRevenuePerYear = lostRevenuePerMonth * 12;

    return {
      lostRevenuePerBusyHour,
      lostRevenuePerWeek,
      lostRevenuePerMonth,
      lostRevenuePerYear,
    };
  }, [customersPerHour, avgOrderAmount, busyHoursPerWeek, walkAwayRate]);

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const allFilled =
    customersPerHour !== '' &&
    avgOrderAmount !== '' &&
    busyHoursPerWeek !== '' &&
    walkAwayRate !== '' &&
    results;

  return (
    <div className="content-page peak-rush-calculator-page">
      <div className="page-container peak-rush-container calculator-viewport-panel">
        <h1 className="peak-rush-title gradient-text">Peak Rush Profit Leak Calculator</h1>
        <p className="peak-rush-subtitle">
          See how much you're losing during your busiest hours — without knowing it.
        </p>

        <div className="peak-rush-card">
          <div className="peak-rush-inputs">
            <div className="peak-rush-input-group">
              <label>🧍 Customers Per Busy Hour</label>
              <span className="peak-rush-helper">Think about your lunch rush, Friday night, etc.</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 50"
                value={customersPerHour}
                onChange={(e) => setCustomersPerHour(e.target.value)}
              />
            </div>
            <div className="peak-rush-input-group">
              <label>💵 Average Order Amount ($)</label>
              <span className="peak-rush-helper">What does a normal order cost?</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 15"
                value={avgOrderAmount}
                onChange={(e) => setAvgOrderAmount(e.target.value)}
              />
            </div>
            <div className="peak-rush-input-group">
              <label>⏰ Busy Hours Per Week</label>
              <span className="peak-rush-helper">Morning rush + lunch + dinner? Count them all.</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 20"
                value={busyHoursPerWeek}
                onChange={(e) => setBusyHoursPerWeek(e.target.value)}
              />
            </div>
            <div className="peak-rush-input-group">
              <label>🚪 Walk-Away Rate (%)</label>
              <span className="peak-rush-helper">Guess how many people give up and leave. 10%? 20%?</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="e.g. 15"
                value={walkAwayRate}
                onChange={(e) => setWalkAwayRate(e.target.value)}
              />
            </div>
          </div>

          {allFilled && (
            <div className="peak-rush-results">
              <div className="peak-rush-yearly-hero" aria-live="polite">
                <div className="peak-rush-yearly-hero-label">You're losing this every year</div>
                <div className="peak-rush-yearly-hero-amount">{formatMoney(results.lostRevenuePerYear)}</div>
              </div>
              <h2 className="peak-rush-breakdown-headline">How it adds up</h2>
              <div className="peak-rush-result-row">💸 <strong>{formatMoney(results.lostRevenuePerBusyHour)}</strong> every busy hour</div>
              <div className="peak-rush-result-row">📅 <strong>{formatMoney(results.lostRevenuePerWeek)}</strong> every week</div>
              <div className="peak-rush-result-row">📆 <strong>{formatMoney(results.lostRevenuePerMonth)}</strong> every month</div>
              <div className="peak-rush-cta-wrap">
                <button type="button" className="primary-button large peak-rush-cta" onClick={() => setBookingOpen(true)}>Let's Fix This →</button>
                <p className="peak-rush-reassure">Most businesses recover 60–80% of this within 90 days.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
};

export default CostBenefitAnalysis;
