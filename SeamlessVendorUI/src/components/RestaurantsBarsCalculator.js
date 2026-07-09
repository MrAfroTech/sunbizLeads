import React, { useState, useMemo } from 'react';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import BookingModal from './BookingModal';

const ABANDON_RATE = 0.45;

const RestaurantsBarsCalculator = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [coversPerDay, setCoversPerDay] = useState('');
  const [avgCheckAmount, setAvgCheckAmount] = useState('');
  const [daysOpenPerYear, setDaysOpenPerYear] = useState('');

  const results = useMemo(() => {
    const covers = parseFloat(coversPerDay) || 0;
    const order = parseFloat(avgCheckAmount) || 0;
    const days = parseFloat(daysOpenPerYear) || 0;

    const guestsLost = Math.round(covers * ABANDON_RATE);
    const perDay = guestsLost * order;
    const perYear = perDay * days;
    const perGuestLost = order * ABANDON_RATE;

    return {
      lostRevenuePerDay: perDay,
      lostRevenuePerYear: perYear,
      perGuestLost,
      guestsLost,
    };
  }, [coversPerDay, avgCheckAmount, daysOpenPerYear]);

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
            Your guests want to order. The wait is sending them elsewhere.
          </h1>
          <p className="watch-vs-order-hero-sub">
            Every Friday night. Every brunch rush. Every happy hour. Guests choose the shorter line — and your revenue walks out the door with them.
          </p>

          <div className="watch-vs-order-stat-strip">
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">45%</div>
              <div className="watch-vs-order-stat-label">of guests abandon orders when the wait looks too long</div>
            </div>
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">77%</div>
              <div className="watch-vs-order-stat-label">would spend more if service was faster</div>
            </div>
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">80%+</div>
              <div className="watch-vs-order-stat-label">of diners have skipped an order due to wait time at least once</div>
            </div>
          </div>
        </section>

        <div className="watch-vs-order-calc-wrapper">
          <div className="watch-vs-order-calc-card">
            <div className="watch-vs-order-calc-header">
              <h2>Calculate Your Losses</h2>
              <p>Enter your numbers below — see exactly how much you're leaving on the floor each year.</p>
            </div>

            <div className="watch-vs-order-calc-body">
              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">🍽 Covers per day</div>
                <div className="watch-vs-order-field-desc">Average number of guests served on a typical day</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 200"
                  value={coversPerDay}
                  onChange={(e) => setCoversPerDay(e.target.value)}
                />
              </div>

              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">💵 Average check amount ($)</div>
                <div className="watch-vs-order-field-desc">Typical guest spend per visit — food and drinks</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 35"
                  value={avgCheckAmount}
                  onChange={(e) => setAvgCheckAmount(e.target.value)}
                />
              </div>

              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">📅 Days open per year</div>
                <div className="watch-vs-order-field-desc">Include all service days</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 300"
                  value={daysOpenPerYear}
                  onChange={(e) => setDaysOpenPerYear(e.target.value)}
                />
              </div>

              <hr className="watch-vs-order-divider" />

              <div className="watch-vs-order-result-block">
                <div className="watch-vs-order-result-section-label">Restaurants & Bars</div>
                <div className="watch-vs-order-result-label">💸 Lost revenue per year</div>
                <div className="watch-vs-order-result-amount" aria-live="polite">{formatMoney(results.lostRevenuePerYear)}</div>
                <div className="watch-vs-order-result-sub">That's real money guests wanted to spend — but walked away from.</div>

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
              <div className="watch-vs-order-cta-headline">What would you do with an extra {formatMoney(results.lostRevenuePerYear)} in annual sales?</div>
              <button type="button" className="watch-vs-order-cta-btn" onClick={() => setBookingOpen(true)}>Schedule a Demo</button>
              <div className="watch-vs-order-cta-proof">Trusted by bars and restaurants driving more revenue per shift.</div>
            </div>
          </div>
        </div>
      </div>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
};

export default RestaurantsBarsCalculator;
