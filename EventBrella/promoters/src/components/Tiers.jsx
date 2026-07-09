import { TIERS } from '../data/content';

function TierName({ lines }) {
  if (lines.length === 1) {
    return lines[0];
  }
  return (
    <>
      {lines[0]}
      <br />
      {lines[1]}
    </>
  );
}

export default function Tiers() {
  return (
    <section className="tiers" id="tiers">
      <div className="sec-head">
        <div className="sec-eyebrow">Five Ways In</div>
        <h2>Pick Your Night</h2>
        <p>Every tier includes the same QR — your ticket, your parking, your tab, all in one pass.</p>
      </div>

      <div className="tier-track">
        {TIERS.map((tier) => (
          <div key={tier.id} className={tier.className}>
            {tier.badge ? <span className="most-flex">{tier.badge}</span> : null}
            <div className="tier-num">{tier.num}</div>
            <div className="tier-name">
              <TierName lines={tier.nameLines} />
            </div>
            <div className="tier-price">
              {tier.price}
              {tier.priceSup ? <sup>{tier.priceSup}</sup> : null}
            </div>
            <div className="tier-desc">{tier.desc}</div>
            <ul className="tier-list">
              {tier.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
              {tier.featureEmphasis ? (
                <li>
                  One QR for the gate <em>and</em> the lot
                </li>
              ) : null}
            </ul>
            <div className="tier-btn">Select</div>
          </div>
        ))}
      </div>
    </section>
  );
}
