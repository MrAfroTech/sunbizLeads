import React, { useState } from 'react';
import { CALCULATOR_PLUS_PRICE } from '../config/stripeConstants';
import { markCalculatorVisitReachedCheckout } from '../lib/calculatorPageVisits';
import { getStoredContactEmail } from '../lib/seamlesslyContactCapture';
import '../styles/CalculatorPlus.css';

const INCLUDED_ITEMS = [
  'Venue-specific deployment blueprint',
  'Priority-ranked missed revenue opportunities',
  'Month-by-month ROI recovery timeline',
  'Competitor benchmarking by venue type and size',
  'Downloadable branded PDF report',
];

const CalculatorPlusUpsell = ({
  venueType = 'Stadium',
  dailyCovers = 0,
  avgOrderValue = 0,
  missedRevenue = 0,
  customerEmail = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/calculator-plus-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueType,
          dailyCovers,
          avgOrderValue,
          missedRevenue,
          customerEmail: customerEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.message || 'Checkout could not be started.');
      }
      await markCalculatorVisitReachedCheckout({
        email: customerEmail || getStoredContactEmail() || undefined,
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="calculator-plus-upsell" role="region" aria-label="Calculator Plus upgrade">
      <div className="calculator-plus-upsell-badge">Calculator Plus</div>
      <h3 className="calculator-plus-upsell-headline">You Know the Number. Now Get the Roadmap.</h3>
      <p className="calculator-plus-upsell-body">
        Calculator Plus breaks down exactly where you&apos;re losing revenue, ranks your biggest opportunities
        by priority, shows your ROI recovery timeline, and generates a branded PDF report you can take into
        any meeting.
      </p>
      <ul className="calculator-plus-upsell-list">
        {INCLUDED_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="calculator-plus-upsell-price">
        <span className="calculator-plus-upsell-price-amount">$17</span>
        <span className="calculator-plus-upsell-price-label">one-time</span>
      </div>
      <button
        type="button"
        className="calculator-plus-upsell-cta"
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? 'Redirecting to checkout…' : `Unlock Calculator Plus — $${CALCULATOR_PLUS_PRICE.amountCents / 100}`}
      </button>
      {error ? <p className="calculator-plus-upsell-error">{error}</p> : null}
    </div>
  );
};

export default CalculatorPlusUpsell;
