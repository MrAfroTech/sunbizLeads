import { CHECKOUT_PREVIEW } from '../data/content';

export default function Checkout() {
  return (
    <section className="checkout">
      <div className="sec-head">
        <div className="sec-eyebrow">One Checkout</div>
        <h2>Ticket. Parking. Done.</h2>
        <p>No second site for parking. No separate app. One card, one confirmation, one QR.</p>
      </div>

      <div className="checkout-card">
        <div className="co-title">{CHECKOUT_PREVIEW.title}</div>
        <div className="co-sub">{CHECKOUT_PREVIEW.subtitle}</div>
        {CHECKOUT_PREVIEW.lines.map((line) => (
          <div key={line.label} className="co-line">
            <span>{line.label}</span>
            <span>{line.value}</span>
          </div>
        ))}
        <div className="co-line total">
          <span>Total</span>
          <span>{CHECKOUT_PREVIEW.total}</span>
        </div>
        <button type="button" className="pay-btn">
          Pay with Apple Pay
        </button>
        <div className="co-note">Your pass + parking spot are sent instantly. Same code, all night.</div>
      </div>
    </section>
  );
}
