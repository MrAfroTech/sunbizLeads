import React, { useState, useMemo } from 'react';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import BookingModal from './BookingModal';

const ABANDON_RATE = 0.45;

const HotelsResortsCalculator = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [guestsPerDay, setGuestsPerDay] = useState('');
  const [avgOrderAmount, setAvgOrderAmount] = useState('');
  const [daysOpenPerYear, setDaysOpenPerYear] = useState('');

  const results = useMemo(() => {
    const guests = parseFloat(guestsPerDay) || 0;
    const order = parseFloat(avgOrderAmount) || 0;
    const days = parseFloat(daysOpenPerYear) || 0;

    const guestsLost = Math.round(guests * ABANDON_RATE);
    const perDay = guestsLost * order;
    const perYear = perDay * days;
    const perGuestLost = order * ABANDON_RATE;

    return {
      lostRevenuePerDay: perDay,
      lostRevenuePerYear: perYear,
      perGuestLost,
      guestsLost,
    };
  }, [guestsPerDay, avgOrderAmount, daysOpenPerYear]);

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatMoneyDec = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="content-page watch-vs-order-page">
      <div className="watch-vs-order-container">
        <section className="watch-vs-order-hero">
          <div className="watch-vs-order-eyebrow">Revenue Intelligence</div>
          <h1 className="watch-vs-order-title">
            Your guests want to order. Slow service is costing you ancillary revenue.
          </h1>
          <p className="watch-vs-order-hero-sub">
            Every pool rush. Every breakfast hour. Every late-night craving. Guests choose convenience — and when you can't deliver it fast enough, the revenue goes to the minibar or nowhere at all.
          </p>

          <div className="watch-vs-order-stat-strip">
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">45%</div>
              <div className="watch-vs-order-stat-label">of hotel guests abandon F&B orders when the wait looks too long</div>
            </div>
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">77%</div>
              <div className="watch-vs-order-stat-label">would spend more on property if service was faster</div>
            </div>
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">80%+</div>
              <div className="watch-vs-order-stat-label">of resort guests have skipped an on-property purchase due to wait time</div>
            </div>
          </div>
        </section>

        <div className="watch-vs-order-calc-wrapper">
          <div className="watch-vs-order-calc-card">
            <div className="watch-vs-order-calc-header">
              <h2>Calculate Your Losses</h2>
              <p>Enter your numbers below — see exactly how much ancillary revenue you're leaving on the floor each year.</p>
            </div>

            <div className="watch-vs-order-calc-body">
              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">🏨 Guests per day</div>
                <div className="watch-vs-order-field-desc">Average number of guests on property on a typical day</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 300"
                  value={guestsPerDay}
                  onChange={(e) => setGuestsPerDay(e.target.value)}
                />
              </div>

              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">💵 Average order amount ($)</div>
                <div className="watch-vs-order-field-desc">Typical guest spend per day — dining, bar, room service</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 45"
                  value={avgOrderAmount}
                  onChange={(e) => setAvgOrderAmount(e.target.value)}
                />
              </div>

              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">📅 Days open per year</div>
                <div className="watch-vs-order-field-desc">Full operating days annually</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 365"
                  value={daysOpenPerYear}
                  onChange={(e) => setDaysOpenPerYear(e.target.value)}
                />
              </div>

              <hr className="watch-vs-order-divider" />

              <div className="watch-vs-order-result-block">
                <div className="watch-vs-order-result-section-label">Hotels & Resorts</div>
                <div className="watch-vs-order-result-label">💸 Lost ancillary revenue per year</div>
                <div className="watch-vs-order-result-amount" aria-live="polite">{formatMoney(results.lostRevenuePerYear)}</div>
                <div className="watch-vs-order-result-sub">That's real money guests wanted to spend on property — but didn't.</div>

                <div className="watch-vs-order-breakdown">
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoney(results.lostRevenuePerDay)}</div>
                    <div className="watch-vs-order-breakdown-label">left on the table per day</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoneyDec(results.perGuestLost)}</div>
                    <div className="watch-vs-order-breakdown-label">lost per guest, per day</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{results.guestsLost.toLocaleString()}</div>
                    <div className="watch-vs-order-breakdown-label">guests who never ordered</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="watch-vs-order-cta-block">
              <div className="watch-vs-order-cta-headline">What would you do with an extra {formatMoney(results.lostRevenuePerYear)} in annual ancillary revenue?</div>
              <button type="button" className="watch-vs-order-cta-btn" onClick={() => setBookingOpen(true)}>Schedule a Demo</button>
              <div className="watch-vs-order-cta-proof">Trusted by hotels and resorts capturing more on-property spend per stay.</div>
            </div>
          </div>
        </div>
      </div>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
};

export default HotelsResortsCalculator;
