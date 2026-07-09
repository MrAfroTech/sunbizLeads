import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  computeLeakMomentAmounts,
  VISIBLE_LEAK_MOMENT_ID,
} from '../lib/leakReportMoments';
import { parseVenueLeakFormFromSearchParams } from '../lib/journeyContactHelpers';
import { useCalculatorReveal } from '../hooks/useCalculatorReveal';
import CalculatorResultCard from './CalculatorResultCard';
import CalculatorScheduleCTA from './CalculatorScheduleCTA';
import CalculatorTotalLeakBanner from './CalculatorTotalLeakBanner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const HERO_LEAK_GATE_HEADLINE = 'See the rest of the damage';
export const HERO_LEAK_GATE_BODY =
  'Get the full breakdown of all four friction points, plus one fix you can implement tonight.';
export const HERO_LEAK_GATE_PHONE =
  'Add your number for a free 15-minute revenue walkthrough.';

const CalculatorLeakResults = ({
  metrics,
  visibleMomentLoss,
  resultCards: resultCardsProp,
  visibleCardId,
  formatMoney,
  onReportSubmit,
  onConsultationCta,
  calculatorType = 'wait',
  heroHeadline,
  heroSubhead,
  gateHeadline,
  gateBody,
  gateCta,
  gateChecks,
  organizationFieldPlaceholder = 'Venue Name',
  organizationFieldError = 'Please enter your venue name.',
  phoneIncentiveText = HERO_LEAK_GATE_PHONE,
  totalBannerSubline,
  gridAriaLabel = 'Friction timeline',
  presentationMode = false,
  heroCard = false,
  heroEyebrow,
  requirePhone = false,
  postRevealExtras = null,
}) => {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [venueName, setVenueName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  const resolvedVisibleCardId = visibleCardId ?? VISIBLE_LEAK_MOMENT_ID;

  const momentCards = useMemo(() => {
    if (resultCardsProp?.length) return resultCardsProp;
    return computeLeakMomentAmounts(metrics);
  }, [metrics, resultCardsProp]);

  const lockedMoments = useMemo(
    () =>
      momentCards.filter(
        (moment) => !moment.initiallyRevealed && moment.id !== resolvedVisibleCardId
      ),
    [momentCards, resolvedVisibleCardId]
  );

  const {
    phoneUnlocked,
    beginStaggeredReveal,
    isLockedCardRevealed,
    showPostReveal,
    revealAnchorRef,
    showTotalBanner,
  } = useCalculatorReveal({
    calculatorType,
    lockedCardCount: presentationMode ? 0 : lockedMoments.length,
  });

  const allResultsVisible = presentationMode || phoneUnlocked;

  const totalLeak = useMemo(
    () => momentCards.reduce((sum, moment) => sum + (moment.amount || 0), 0),
    [momentCards]
  );

  useEffect(() => {
    const contact = parseVenueLeakFormFromSearchParams(searchParams);
    if (contact.firstName) setFirstName(contact.firstName);
    if (contact.email) setEmail(contact.email);
    if (contact.phone) setPhone(contact.phone);
    if (contact.venueName) setVenueName(contact.venueName);
  }, [searchParams]);

  const resolvedSubhead =
    heroSubhead ||
    (heroCard
      ? "That's just one of four leaks. The rest are still running."
      : "That's just one of six leaks. The rest are still running.");

  const visibleMoment = useMemo(
    () => momentCards.find((moment) => moment.id === resolvedVisibleCardId) || momentCards[0],
    [momentCards, resolvedVisibleCardId]
  );

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');

    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedVenue = venueName.trim();

    if (!trimmedFirstName) {
      setError('Please enter your first name.');
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!trimmedVenue) {
      setError(organizationFieldError);
      return;
    }
    if (requirePhone && trimmedPhone.replace(/\D/g, '').length < 7) {
      setError('Please enter your phone number.');
      return;
    }
    if (!onReportSubmit) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSubmitting(true);
    let result;
    try {
      result = await onReportSubmit({
        firstName: trimmedFirstName,
        email: trimmedEmail,
        phone: trimmedPhone || null,
        venueName: trimmedVenue,
      });
    } catch {
      setSubmitting(false);
      setError('Something went wrong. Please try again.');
      return;
    }
    setSubmitting(false);

    if (result?.ok === false) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSubmittedEmail(trimmedEmail);
    setSubmittedName(trimmedFirstName);
    setSubmittedPhone(trimmedPhone || '');
    setSubmitted(true);
    beginStaggeredReveal();
  };

  if (heroCard) {
    const hiddenMoments = momentCards
      .filter((moment) => moment.id !== resolvedVisibleCardId)
      .slice(0, 3);

    return (
      <div className={`leak-results leak-results--hero-card${allResultsVisible ? ' leak-results--unlocked' : ''}`}>
        <p className="leak-results__eyebrow">{heroEyebrow || 'Revenue impact'}</p>
        <h3 className="leak-results__hero-card-headline">
          {heroHeadline || (
            <>
              You lost{' '}
              <span className="leak-results__hero-card-figure">
                {formatMoney(visibleMomentLoss ?? visibleMoment?.amount ?? 0)}
              </span>{' '}
              {calculatorType === 'wait'
                ? 'in reorders because the guest waited too long'
                : visibleMoment?.name
                  ? `— ${(visibleMoment.title || visibleMoment.name).toLowerCase()}`
                  : 'in one friction moment'}
            </>
          )}
        </h3>
        <p className="leak-results__subhead">{resolvedSubhead}</p>

        {presentationMode || showTotalBanner ? (
          <CalculatorTotalLeakBanner
            totalLeak={totalLeak}
            formatMoney={formatMoney}
            subline={totalBannerSubline}
          />
        ) : null}

        <ul className="leak-results__hidden-lines" aria-label={gridAriaLabel} ref={revealAnchorRef}>
          {hiddenMoments.map((moment, lockedIndex) => {
            const revealed =
              presentationMode || (!phoneUnlocked ? false : isLockedCardRevealed(lockedIndex));
            const title = moment.title || moment.name;
            return (
              <li
                key={moment.id}
                className={[
                  'leak-results__hidden-line',
                  revealed ? 'leak-results__hidden-line--revealed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="leak-results__hidden-line-label">{title}</span>
                <span
                  className={[
                    'leak-results__hidden-line-amount',
                    !revealed ? 'leak-results__hidden-line-amount--locked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden={!revealed}
                >
                  {revealed ? formatMoney(moment.amount) : '$00,000'}
                </span>
              </li>
            );
          })}
        </ul>

        {!presentationMode && showPostReveal && submittedEmail ? (
          <>
            {typeof postRevealExtras === 'function'
              ? postRevealExtras({
                  email: submittedEmail,
                  name: submittedName,
                  phone: submittedPhone,
                })
              : postRevealExtras}
            <CalculatorScheduleCTA
              calculatorType={calculatorType}
              email={submittedEmail}
              name={submittedName}
              phone={submittedPhone}
            />
          </>
        ) : null}

        {!presentationMode && !phoneUnlocked ? (
          <section className="leak-gate cta-box">
            <h3 className="leak-gate__headline">
              {gateHeadline || HERO_LEAK_GATE_HEADLINE}
            </h3>
            <p className="leak-gate__body">
              {gateBody || HERO_LEAK_GATE_BODY}
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
                    <span className="leak-gate__phone-incentive">{phoneIncentiveText}</span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      autoComplete="tel"
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
                    <span className="sr-only">{organizationFieldPlaceholder}</span>
                    <input
                      type="text"
                      name="venueName"
                      placeholder={organizationFieldPlaceholder}
                      autoComplete="organization"
                      required
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {error ? <p className="leak-gate__error">{error}</p> : null}

              <button type="submit" className="leak-gate__cta" disabled={submitting}>
                {submitting ? 'Sending…' : gateCta || 'Show Me Everything →'}
              </button>

              <ul className="leak-gate__checks">
                {(gateChecks || [
                  'Full breakdown of all 4 friction points',
                  '1 actionable fix you can implement tonight',
                ]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </form>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`leak-results${allResultsVisible ? ' leak-results--unlocked' : ''}`}>
      <div className="calculator-funnel-state calculator-funnel-state--results">
        <header className="leak-results__hero-block" aria-live="polite">
          <h3 className="leak-results__headline">
            {heroHeadline || (
              <>
                YOU LOST <span className="leak-results__figure">{formatMoney(visibleMomentLoss)}</span> IN MOMENT #{VISIBLE_LEAK_MOMENT_ID}
              </>
            )}
          </h3>
          <p className="leak-results__subhead">{resolvedSubhead}</p>
          <hr className="leak-results__rule" />
        </header>

        {presentationMode || showTotalBanner ? (
          <CalculatorTotalLeakBanner
            totalLeak={totalLeak}
            formatMoney={formatMoney}
            subline={totalBannerSubline}
          />
        ) : null}

        <section className="moments-grid" aria-label={gridAriaLabel}>
          {momentCards.map((moment, cardIndex) => {
            const isHero =
              moment.initiallyRevealed || moment.id === resolvedVisibleCardId;
            const lockedIndex = lockedMoments.findIndex((item) => item.id === moment.id);
            const isFirstCard = cardIndex === 0;
            const indexLabel =
              moment.indexLabel ||
              (typeof moment.id === 'number' ? `Moment ${moment.id}` : String(moment.id));
            const title = moment.title || moment.name;
            const descriptor = moment.descriptor || moment.shortLabel;

            return (
              <CalculatorResultCard
                key={moment.id}
                ref={isFirstCard ? revealAnchorRef : undefined}
                indexLabel={indexLabel}
                title={title}
                descriptor={descriptor}
                amount={isHero && visibleMomentLoss != null ? visibleMomentLoss : moment.amount}
                formatMoney={formatMoney}
                initiallyRevealed={isHero || presentationMode}
                isRevealed={
                  presentationMode ||
                  (!isHero && lockedIndex >= 0 && isLockedCardRevealed(lockedIndex))
                }
                spanFull={Boolean(moment.spanFull)}
              />
            );
          })}
        </section>

        {!presentationMode && showPostReveal && submittedEmail ? (
          <CalculatorScheduleCTA
            calculatorType={calculatorType}
            email={submittedEmail}
            name={submittedName}
            phone={submittedPhone}
          />
        ) : null}
      </div>

      {!presentationMode && !phoneUnlocked ? (
      <div className="calculator-funnel-state calculator-funnel-state--gate">
        <section className="leak-gate cta-box">
            <>
              <h3 className="leak-gate__headline">
                {gateHeadline || HERO_LEAK_GATE_HEADLINE}
            </h3>
            <p className="leak-gate__body">
              {gateBody || HERO_LEAK_GATE_BODY}
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
                        {phoneIncentiveText}
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        autoComplete="tel"
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
                      <span className="sr-only">{organizationFieldPlaceholder}</span>
                      <input
                        type="text"
                        name="venueName"
                        placeholder={organizationFieldPlaceholder}
                        autoComplete="organization"
                        required
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                {error ? <p className="leak-gate__error">{error}</p> : null}

                <button type="submit" className="leak-gate__cta" disabled={submitting}>
                  {submitting ? 'Sending…' : gateCta || 'Show Me Everything →'}
                </button>

                <ul className="leak-gate__checks">
                  {(gateChecks || [
                    'Full breakdown of all 6 friction points',
                    '1 actionable fix you can implement tonight',
                  ]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </form>
            </>
        </section>
      </div>
      ) : null}
    </div>
  );
};

export default CalculatorLeakResults;
