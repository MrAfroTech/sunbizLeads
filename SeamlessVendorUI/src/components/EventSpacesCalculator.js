import React, { useState, useMemo } from 'react';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import BookingModal from './BookingModal';

const ABANDON_RATE = 0.45;

const EventSpacesCalculator = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [attendeesPerEvent, setAttendeesPerEvent] = useState('');
  const [avgOrderAmount, setAvgOrderAmount] = useState('');
  const [eventsPerYear, setEventsPerYear] = useState('');

  const results = useMemo(() => {
    const attendees = parseFloat(attendeesPerEvent) || 0;
    const order = parseFloat(avgOrderAmount) || 0;
    const events = parseFloat(eventsPerYear) || 0;

    const attendeesLost = Math.round(attendees * ABANDON_RATE);
    const perEvent = attendeesLost * order;
    const perYear = perEvent * events;
    const perAttendeeLost = order * ABANDON_RATE;

    return {
      lostRevenuePerEvent: perEvent,
      lostRevenuePerYear: perYear,
      perAttendeeLost,
      attendeesLost,
    };
  }, [attendeesPerEvent, avgOrderAmount, eventsPerYear]);

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
            Your attendees want to spend. The line is costing you.
          </h1>
          <p className="watch-vs-order-hero-sub">
            Every keynote break. Every cocktail hour. Every general session rush. Attendees choose the game over the queue — and your per-cap revenue disappears with them.
          </p>

          <div className="watch-vs-order-stat-strip">
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">45%</div>
              <div className="watch-vs-order-stat-label">of attendees abandon F&B lines when the wait looks too long</div>
            </div>
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">77%</div>
              <div className="watch-vs-order-stat-label">would spend more if wait times were shorter</div>
            </div>
            <div className="watch-vs-order-stat-item">
              <div className="watch-vs-order-stat-num">80%+</div>
              <div className="watch-vs-order-stat-label">of event attendees have skipped a purchase due to line length at least once</div>
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
                <div className="watch-vs-order-field-label">👥 Attendees per event</div>
                <div className="watch-vs-order-field-desc">Average attendance at a typical event</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 500"
                  value={attendeesPerEvent}
                  onChange={(e) => setAttendeesPerEvent(e.target.value)}
                />
              </div>

              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">💵 Average order amount ($)</div>
                <div className="watch-vs-order-field-desc">Typical attendee spend per event — food, drinks, merch</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 25"
                  value={avgOrderAmount}
                  onChange={(e) => setAvgOrderAmount(e.target.value)}
                />
              </div>

              <div className="watch-vs-order-field-group">
                <div className="watch-vs-order-field-label">📅 Events per year</div>
                <div className="watch-vs-order-field-desc">Total number of events hosted annually</div>
                <input
                  className="watch-vs-order-field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 50"
                  value={eventsPerYear}
                  onChange={(e) => setEventsPerYear(e.target.value)}
                />
              </div>

              <hr className="watch-vs-order-divider" />

              <div className="watch-vs-order-result-block">
                <div className="watch-vs-order-result-section-label">Event Spaces</div>
                <div className="watch-vs-order-result-label">💸 Lost revenue per year</div>
                <div className="watch-vs-order-result-amount" aria-live="polite">{formatMoney(results.lostRevenuePerYear)}</div>
                <div className="watch-vs-order-result-sub">That's real money attendees wanted to spend — but walked away from.</div>

                <div className="watch-vs-order-breakdown">
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoney(results.lostRevenuePerEvent)}</div>
                    <div className="watch-vs-order-breakdown-label">left on the table per event</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoneyDec(results.perAttendeeLost)}</div>
                    <div className="watch-vs-order-breakdown-label">lost per attendee, per event</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{results.attendeesLost.toLocaleString()}</div>
                    <div className="watch-vs-order-breakdown-label">attendees who never ordered</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="watch-vs-order-cta-block">
              <div className="watch-vs-order-cta-headline">What would you do with an extra {formatMoney(results.lostRevenuePerYear)} in annual event revenue?</div>
              <button type="button" className="watch-vs-order-cta-btn" onClick={() => setBookingOpen(true)}>Schedule a Demo</button>
              <div className="watch-vs-order-cta-proof">Trusted by event venues and conference centers driving higher per-cap spend.</div>
            </div>
          </div>
        </div>
      </div>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
};

export default EventSpacesCalculator;
