import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ARCADE_DISCLOSURE =
  'Arcade games are for entertainment and game play only. Any tickets, points or prizes won from arcade games are not redeemable or accessible for cash or prizes.';

// Public Turnstile site key (same as payment.html / TURNSTILE_SITE_KEY)
const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACame_Us1N8bvx4T';

const LOUNGE_TIERS = [
  {
    id: 'lounge_all_access',
    name: 'All Access Pass',
    priceCents: 2500,
    priceLabel: '$25',
    description:
      'Access to BOTH parties: New Social Lounge & The Bowling Experience PLUS an Unlimited Arcade Play Pass (Unlimited games all night long!)',
    includesArcade: true,
  },
  {
    id: 'lounge_ga',
    name: 'General Admission (Social Lounge Only)',
    priceCents: 1500,
    priceLabel: '$15',
    description: 'Entry to the Social Lounge experience.',
    includesArcade: false,
  },
  {
    id: 'lounge_ga_arcade',
    name: 'General Admission + Arcade Play Pass',
    priceCents: 2000,
    priceLabel: '$20',
    description:
      'Includes entry to the Social Lounge + Unlimited Arcade Play Pass (Play unlimited arcade games all night!)',
    includesArcade: true,
  },
];

const emptyForm = {
  guestName: '',
  guestPhone: '',
  guestEmail: '',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 1st & 3rd Thursdays from today through Dec 31, 2026 */
function getRecurringEventDates(throughYear = 2026) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(throughYear, 11, 31);
  end.setHours(23, 59, 59, 999);

  for (let year = today.getFullYear(); year <= throughYear; year++) {
    for (let month = 0; month < 12; month++) {
      const firstOfMonth = new Date(year, month, 1);
      const firstThursday = 1 + ((4 - firstOfMonth.getDay() + 7) % 7);
      for (const day of [firstThursday, firstThursday + 14]) {
        const date = new Date(year, month, day);
        if (date < today || date > end) continue;
        dates.push({
          value: toDateKey(date),
          label: date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
        });
      }
    }
  }
  return dates;
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text?.slice(0, 160) || `Request failed (${res.status})`);
  }
}

export default function LoungeReservation() {
  const eventDates = useMemo(() => getRecurringEventDates(2026), []);
  const [eventDate, setEventDate] = useState(() => getRecurringEventDates(2026)[0]?.value || '');
  const [selectedTier, setSelectedTier] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileHostRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);
  const closeBtnRef = useRef(null);

  const tier = LOUNGE_TIERS.find((t) => t.id === selectedTier) || null;

  function closeModal() {
    if (submitting) return;
    setSelectedTier(null);
    setError('');
    setTurnstileToken('');
  }

  // Live-mode checkout requires Turnstile; render when guest modal is shown.
  useEffect(() => {
    if (!tier || !turnstileHostRef.current) return undefined;

    let cancelled = false;
    let attempts = 0;

    function renderWidget() {
      if (cancelled || !turnstileHostRef.current) return;
      const api = typeof window !== 'undefined' ? window.turnstile : null;
      if (!api) {
        if (attempts++ < 40) window.setTimeout(renderWidget, 100);
        return;
      }
      if (turnstileWidgetIdRef.current != null) {
        try {
          api.remove(turnstileWidgetIdRef.current);
        } catch {
          /* ignore */
        }
        turnstileWidgetIdRef.current = null;
      }
      turnstileHostRef.current.innerHTML = '';
      turnstileWidgetIdRef.current = api.render(turnstileHostRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setTurnstileToken(token || ''),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      });
    }

    setTurnstileToken('');
    renderWidget();

    return () => {
      cancelled = true;
      const api = typeof window !== 'undefined' ? window.turnstile : null;
      if (api && turnstileWidgetIdRef.current != null) {
        try {
          api.remove(turnstileWidgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
      turnstileWidgetIdRef.current = null;
    };
  }, [tier]);

  // Lock body scroll + Escape closes modal while open
  useEffect(() => {
    if (!tier) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus?.();

    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [tier, submitting]);

  function onDateChange(e) {
    setEventDate(e.target.value);
    setError('');
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!eventDate || !selectedTier || !tier) return;
    setSubmitting(true);
    setError('');

    try {
      if (!turnstileToken) {
        throw new Error('Please complete the security verification and try again.');
      }
      const res = await fetch('/api/stripe-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          eventDate,
          eventName: 'Social Lounge',
          customerName: form.guestName,
          customerPhone: form.guestPhone,
          customerEmail: form.guestEmail,
          ticketCount: 1,
          cancelPath: '/#lounge',
          cfTurnstileResponse: turnstileToken,
        }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Checkout failed');
      }
      if (!data.sessionUrl) {
        throw new Error('No checkout session URL received');
      }
      window.location.href = data.sessionUrl;
    } catch (err) {
      setError(err.message || 'Checkout failed');
      setSubmitting(false);
      setTurnstileToken('');
      try {
        window.turnstile?.reset?.(turnstileWidgetIdRef.current);
      } catch {
        /* ignore */
      }
    }
  }

  const modal = tier
    ? createPortal(
        <div
          className="reserve-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="reserve-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lounge-guest-details-title"
            onClick={(e) => e.stopPropagation()}
          >
            <form className="frame" onSubmit={onSubmit}>
              <div className="inner">
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="reserve-modal-close"
                  aria-label="Close guest details"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  ×
                </button>
                <div className="reserve-modal-eyebrow">Checkout</div>
                <h3 id="lounge-guest-details-title">Guest details</h3>
                <p className="reserve-modal-copy">
                  {tier.name} · {tier.priceLabel} · Selected date above
                </p>

                <div className="reserve-form">
                  <label>
                    <span>Name</span>
                    <input
                      name="guestName"
                      type="text"
                      autoComplete="name"
                      required
                      value={form.guestName}
                      onChange={onChange}
                      placeholder="Full name"
                      disabled={submitting}
                    />
                  </label>
                  <label>
                    <span>Phone number</span>
                    <input
                      name="guestPhone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={form.guestPhone}
                      onChange={onChange}
                      placeholder="(555) 555-5555"
                      disabled={submitting}
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      name="guestEmail"
                      type="email"
                      autoComplete="email"
                      required
                      value={form.guestEmail}
                      onChange={onChange}
                      placeholder="you@email.com"
                      disabled={submitting}
                    />
                  </label>

                  <div className="lounge-order-summary">
                    <span>Total</span>
                    <strong>{tier.priceLabel}</strong>
                  </div>

                  <div
                    ref={turnstileHostRef}
                    className="lounge-turnstile"
                    aria-label="Security verification"
                  />

                  {error && <div className="reserve-error" role="alert">{error}</div>}

                  <button
                    type="submit"
                    className="reserve-submit lounge-checkout-btn"
                    disabled={submitting || !eventDate || !turnstileToken}
                  >
                    {submitting ? 'Redirecting to checkout…' : `Pay ${tier.priceLabel} — Continue to Checkout`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="lounge-ticket-flow">
      <div className="lounge-date-picker">
        <label>
          <span>Select event date</span>
          <select
            name="eventDate"
            value={eventDate}
            onChange={onDateChange}
            required
            disabled={!eventDates.length || submitting}
          >
            {eventDates.length === 0 && (
              <option value="">No upcoming dates available</option>
            )}
            {eventDates.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </label>
        <p className="lounge-date-note">Every 1st &amp; 3rd Thursday · Prebook through the end of 2026</p>
      </div>

      <div className="lounge-tier-grid" role="radiogroup" aria-label="Social Lounge ticket tiers">
        {LOUNGE_TIERS.map((t) => {
          const selected = t.id === selectedTier;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`lounge-tier-card frame${selected ? ' selected' : ''}`}
              onClick={() => {
                setSelectedTier(t.id);
                setError('');
              }}
              disabled={submitting}
            >
              <div className="inner">
                <div className="icon-badge gold" aria-hidden="true">
                  <span className="lounge-tier-mark">{t.priceLabel}</span>
                </div>
                <div className="lounge-tier-copy">
                  <div className="lounge-tier-name">{t.name}</div>
                  <div className="lounge-tier-price">{t.priceLabel}</div>
                  <p className="lounge-tier-desc">{t.description}</p>
                  {t.includesArcade && (
                    <p className="lounge-tier-disclosure">{ARCADE_DISCLOSURE}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {modal}
    </div>
  );
}
