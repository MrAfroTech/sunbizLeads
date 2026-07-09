export default function Flow() {
  return (
    <section className="flow">
      <div className="flow-copy">
        <div className="sec-eyebrow">Once You&apos;re In</div>
        <h2>Your QR keeps working all night</h2>
        <p>
          Same code that got you past the door and into your spot in the lot now runs your tab. Order from
          your phone, staff sees it, it shows up. No app download, no account to build.
        </p>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="dot">1</div>
            <div>
              <h4>Scan to order</h4>
              <p>Drinks, hookah, bottle service — browse and order from wherever you&apos;re standing.</p>
            </div>
          </div>
          <div className="flow-step">
            <div className="dot">2</div>
            <div>
              <h4>Tap to pay</h4>
              <p>Apple Pay or card on file. No line at the bar to close it out.</p>
            </div>
          </div>
          <div className="flow-step">
            <div className="dot">3</div>
            <div>
              <h4>We remember you</h4>
              <p>Next Tuesday, your usual is already queued up before you say a word.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="phone-mock">
        <div className="ph-head">
          <b>Your Pass</b>
          <span>Active</span>
        </div>
        <div className="qr-block">
          <div className="qr" />
          <small>Scan at door · lot · bar</small>
        </div>
        <div className="order-row">
          <b>Patron Repo</b>
          <span>$175</span>
        </div>
        <div className="order-row">
          <b>Hookah refill</b>
          <span>$25</span>
        </div>
        <div className="order-row">
          <b>Reserved parking</b>
          <span>Included</span>
        </div>
        <div className="order-total">
          <span>Open Tab</span>
          <span>$200</span>
        </div>
        <div className="reorder-tag">
          <b>Welcome back.</b> Same table as last Tuesday — want your usual?
        </div>
      </div>
    </section>
  );
}
