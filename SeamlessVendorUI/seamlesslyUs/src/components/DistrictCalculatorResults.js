import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/CalculatorGlassCard.css';
import { parseVenueLeakFormFromSearchParams } from '../lib/journeyContactHelpers';
import { useCalculatorReveal } from '../hooks/useCalculatorReveal';
import CalculatorResultCard from './CalculatorResultCard';
import CalculatorScheduleCTA from './CalculatorScheduleCTA';
import CalculatorTotalLeakBanner from './CalculatorTotalLeakBanner';
import DownloadReveal from './DownloadReveal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DistrictCalculatorResults = ({
  corridorAnnualLift,
  corridorLiftPerWeekend,
  memberBusinesses,
  friSatFootTraffic,
  districtType,
  formatMoney,
  onReportSubmit,
  onConsultationCta,
}) => {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  const lockedCards = useMemo(() => {
    const businesses = Math.max(memberBusinesses, 1);
    return [
      {
        id: 'weekend',
        indexLabel: 'Weekend impact',
        title: 'Corridor lift per weekend',
        descriptor: 'Friday + Saturday combined across member businesses',
        amount: corridorLiftPerWeekend,
      },
      {
        id: 'per-business',
        indexLabel: 'Member share',
        title: 'Annual lift per member business',
        descriptor: 'Distributed across your active member footprint',
        amount: corridorAnnualLift / businesses,
      },
      {
        id: 'monthly',
        indexLabel: 'Operating rhythm',
        title: 'Average monthly corridor lift',
        descriptor: 'Annual projection divided across twelve months',
        amount: corridorAnnualLift / 12,
        spanFull: true,
      },
    ];
  }, [
    corridorAnnualLift,
    corridorLiftPerWeekend,
    memberBusinesses,
    friSatFootTraffic,
  ]);

  const {
    phoneUnlocked,
    beginStaggeredReveal,
    isLockedCardRevealed,
    showPostReveal,
    revealAnchorRef,
    showTotalBanner,
  } = useCalculatorReveal({
    calculatorType: 'districts',
    lockedCardCount: lockedCards.length,
  });

  const totalLeak = useMemo(
    () =>
      corridorAnnualLift +
      lockedCards.reduce((sum, card) => sum + (card.amount || 0), 0),
    [corridorAnnualLift, lockedCards]
  );

  useEffect(() => {
    const contact = parseVenueLeakFormFromSearchParams(searchParams);
    if (contact.firstName) setFirstName(contact.firstName);
    if (contact.email) setEmail(contact.email);
    if (contact.phone) setPhone(contact.phone);
    if (contact.venueName) setDistrictName(contact.venueName);
  }, [searchParams]);

  const formattedBusinesses = Math.round(memberBusinesses).toLocaleString('en-US');
  const formattedTraffic = Math.round(friSatFootTraffic).toLocaleString('en-US');

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');

    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedDistrict = districtName.trim();

    if (!trimmedFirstName) {
      setError('Please enter your first name.');
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (trimmedPhone.replace(/\D/g, '').length < 7) {
      setError('Please enter a phone number so we can schedule your corridor walkthrough.');
      return;
    }
    if (!trimmedDistrict) {
      setError('Please enter your district or organization name.');
      return;
    }
    if (!onReportSubmit) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSubmitting(true);
    const result = await onReportSubmit({
      firstName: trimmedFirstName,
      email: trimmedEmail,
      phone: trimmedPhone,
      districtName: trimmedDistrict,
    });
    setSubmitting(false);

    if (result?.ok === false) {
      setError(result.error || 'Something went wrong. Please try again.');
      return;
    }

    setSubmittedEmail(trimmedEmail);
    setSubmittedName(trimmedFirstName);
    setSubmittedPhone(trimmedPhone);
    setSubmitted(true);
    beginStaggeredReveal();
  };

  return (
    <div className={`leak-results${phoneUnlocked ? ' leak-results--unlocked' : ''}`}>
      <div className="calculator-funnel-state calculator-funnel-state--results">
        <header className="leak-results__hero-block" aria-live="polite">
          <h3 className="leak-results__headline">
            YOUR CORRIDOR COULD CAPTURE{' '}
            <span className="leak-results__figure">{formatMoney(corridorAnnualLift)}</span> ANNUALLY
          </h3>
          <p className="leak-results__subhead">
            Conservative estimate across {formattedBusinesses} member businesses and{' '}
            {formattedTraffic} Friday/Saturday visitors — modeled for {districtType || 'your district'}.
          </p>
          <hr className="leak-results__rule" />
        </header>

        {showTotalBanner ? (
          <CalculatorTotalLeakBanner totalLeak={totalLeak} formatMoney={formatMoney} />
        ) : null}

        <section className="moments-grid" aria-label="Corridor projection summary">
          <CalculatorResultCard
            ref={revealAnchorRef}
            indexLabel="Annual report number"
            title="Corridor-level revenue lift"
            descriptor="The whole-district gain you can cite in BID reports and city funding requests."
            amount={corridorAnnualLift}
            formatMoney={formatMoney}
            initiallyRevealed
            spanFull
          />

          {lockedCards.map((card, lockedIndex) => (
            <CalculatorResultCard
              key={card.id}
              indexLabel={card.indexLabel}
              title={card.title}
              descriptor={card.descriptor}
              amount={card.amount}
              formatMoney={formatMoney}
              isRevealed={isLockedCardRevealed(lockedIndex)}
              spanFull={card.spanFull}
            />
          ))}
        </section>

        {showPostReveal && submittedEmail ? (
          <div className="sports-gated-results__post-reveal">
            <DownloadReveal
              email={submittedEmail}
              name={submittedName}
              phone={submittedPhone}
            />
            <CalculatorScheduleCTA
              calculatorType="districts"
              email={submittedEmail}
              name={submittedName}
              phone={submittedPhone}
            />
          </div>
        ) : null}
      </div>

      {!phoneUnlocked ? (
      <div className="calculator-funnel-state calculator-funnel-state--gate">
        <section className="leak-gate cta-box calculator-glass-card">
            <>
              <h3 className="leak-gate__headline">Want the full corridor breakdown?</h3>
              <p className="leak-gate__body">
                We&apos;ll send your district projection plus the deployment playbook coordinators use for city council and BID funding conversations.
              </p>

              <form className="leak-gate__form" noValidate onSubmit={handleSubmit}>
                <div className="leak-gate__fields">
                  <div className="leak-gate__fields-row">
                    <label className="leak-gate__field">
                      <span className="sr-only">First Name</span>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </label>
                    <label className="leak-gate__field">
                      <span className="sr-only">Phone Number</span>
                      <span className="leak-gate__phone-incentive">
                        Phone required → personal 15-min corridor walkthrough
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        autoComplete="tel"
                        required
                        value={phone}
                        onFocus={() => onConsultationCta?.()}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="leak-gate__fields-row">
                    <label className="leak-gate__field">
                      <span className="sr-only">Email</span>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>
                    <label className="leak-gate__field">
                      <span className="sr-only">District Name</span>
                      <input
                        type="text"
                        name="districtName"
                        placeholder="District / Organization Name"
                        autoComplete="organization"
                        required
                        value={districtName}
                        onChange={(e) => setDistrictName(e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                {error ? <p className="leak-gate__error">{error}</p> : null}

                <button type="submit" className="leak-gate__cta" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send My Corridor Report →'}
                </button>

                <ul className="leak-gate__checks">
                  <li>Full corridor revenue projection for your annual report</li>
                  <li>Deployment playbook for district-wide mobile ordering</li>
                </ul>
              </form>
            </>
        </section>
      </div>
      ) : null}
    </div>
  );
};

export default DistrictCalculatorResults;
