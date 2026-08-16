import { forwardRef } from 'react';

/**
 * VIP Night Out Pass promotional card — fixed 1000×1000px design canvas.
 * Spec: 8×8" at 125ppi. Export at 2×/3× for print quality.
 */
const VipNightOutPassCard = forwardRef(function VipNightOutPassCard(_props, ref) {
  return (
    <div className="vip-pass-card" ref={ref} role="img" aria-label="VIP Night Out Pass promotional card">
      <div className="vip-pass-frame" aria-hidden="true">
        <span className="vip-pass-corner tl" />
        <span className="vip-pass-corner tr" />
        <span className="vip-pass-corner bl" />
        <span className="vip-pass-corner br" />
      </div>

      <div className="vip-pass-inner">
        <header className="vip-pass-top">
          <div className="vip-pass-eyebrow">STRIKE AFTER DARK</div>
          <div className="vip-pass-wordmark">Social Lounge Featuring Live Comedy</div>
          <div className="vip-pass-badge">New — Premium Tier</div>
        </header>

        <h1 className="vip-pass-headline">The VIP Night Out Pass</h1>
        <p className="vip-pass-subhead">An all-access night out, sized to your group</p>

        <p className="vip-pass-per-guest">1× All Access Pass · 1× Arcade Pass · 2× Drinks · 1× Plate</p>
        <p className="vip-pass-caption">per guest · curated food and drink menu</p>

        <div className="vip-pass-divider" aria-hidden="true" />

        <div className="vip-pass-pricing" role="list">
          <div className="vip-pass-price-col" role="listitem">
            <div className="vip-pass-guests">2 Guests</div>
            <div className="vip-pass-amount">$117</div>
          </div>
          <div className="vip-pass-price-col vip-pass-price-col--best" role="listitem">
            <div className="vip-pass-best-value">Best Value</div>
            <div className="vip-pass-guests">4 Guests</div>
            <div className="vip-pass-amount vip-pass-amount--light">$207</div>
          </div>
          <div className="vip-pass-price-col" role="listitem">
            <div className="vip-pass-guests">6 Guests</div>
            <div className="vip-pass-amount">$299</div>
          </div>
        </div>

        <footer className="vip-pass-footer">
          <div className="vip-pass-venue">THE ALLEY · TAMPA BAY</div>
          <div className="vip-pass-schedule">Every 1st &amp; 3rd Thursday · Prebooking through end of 2026</div>
          <div className="vip-pass-tagline">Live comedy + more, every night out</div>
        </footer>
      </div>
    </div>
  );
});

export default VipNightOutPassCard;
