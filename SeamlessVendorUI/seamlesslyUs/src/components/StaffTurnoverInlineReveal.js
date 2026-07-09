import React, { useMemo, useState } from 'react';
import JourneyLeadCaptureForm from './JourneyLeadCaptureForm';
import { useCalculatorReveal } from '../hooks/useCalculatorReveal';
import CalculatorScheduleCTA from './CalculatorScheduleCTA';
import CalculatorTotalLeakBanner from './CalculatorTotalLeakBanner';
import {
  HERO_LEAK_GATE_BODY,
  HERO_LEAK_GATE_HEADLINE,
} from './CalculatorLeakResults';
import { isContactComplete } from '../lib/journeyContactHelpers';

const StaffTurnoverInlineReveal = ({
  turnoverPerMonthInput,
  monthlyToAnnual,
  milestoneRow,
  formatMoney,
  formatNum,
  contact,
  leadFromUrl,
  onContactChange,
  onReportSubmit,
  onConsultationCta,
  milestoneDays,
  industryAverageTenure,
}) => {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  const annualTurnover = monthlyToAnnual(turnoverPerMonthInput);

  const milestoneCards = useMemo(
    () =>
      milestoneDays.map((days) => {
        const { turnoverAvoided, savings } = milestoneRow(annualTurnover, days);
        const tenureLabel =
          days === industryAverageTenure ? `${days} days (industry avg)` : `${days} days tenure`;
        return {
          id: days,
          indexLabel: tenureLabel,
          title: `Savings at ${days}-day tenure goal`,
          name: `Savings at ${days}-day tenure goal`,
          descriptor:
            days === industryAverageTenure
              ? 'Industry baseline — no incremental savings modeled'
              : `${formatNum(turnoverAvoided)} turnover events avoided annually`,
          amount: savings,
        };
      }),
    [annualTurnover, milestoneDays, milestoneRow, formatNum, industryAverageTenure]
  );

  const visibleCard = milestoneCards.find((card) => card.id === milestoneDays[0]) || milestoneCards[0];
  const hiddenCards = milestoneCards
    .filter((card) => card.id !== visibleCard?.id)
    .slice(0, 3);

  const {
    phoneUnlocked,
    beginStaggeredReveal,
    isLockedCardRevealed,
    showPostReveal,
    revealAnchorRef,
    showTotalBanner,
  } = useCalculatorReveal({
    calculatorType: 'staffturnover',
    lockedCardCount: hiddenCards.length,
  });

  const totalLeak = useMemo(
    () => milestoneCards.reduce((sum, card) => sum + (card.amount || 0), 0),
    [milestoneCards]
  );

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');

    if (!isContactComplete(contact)) {
      setError('Please enter your full name, a valid email, and a phone number (at least 7 digits).');
      return;
    }
    if (!onReportSubmit) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSubmitting(true);
    const result = await onReportSubmit(contact);
    setSubmitting(false);

    if (result?.ok === false) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSubmittedEmail(contact.email.trim().toLowerCase());
    setSubmittedName(contact.fullName.trim());
    setSubmittedPhone(contact.phone.trim());
    setSubmitted(true);
    beginStaggeredReveal();
  };

  return (
    <div className={`leak-results leak-results--hero-card${phoneUnlocked ? ' leak-results--unlocked' : ''}`}>
      <p className="leak-results__eyebrow">Tenure milestone savings</p>
      <h3 className="leak-results__hero-card-headline">
        You could save{' '}
        <span className="leak-results__hero-card-figure">{formatMoney(visibleCard?.amount || 0)}</span> at
        your first tenure milestone
      </h3>
      <p className="leak-results__subhead">
        One milestone revealed. Unlock the full retention roadmap to see every savings tier.
      </p>

      {showTotalBanner ? (
        <CalculatorTotalLeakBanner totalLeak={totalLeak} formatMoney={formatMoney} />
      ) : null}

      <ul className="leak-results__hidden-lines" aria-label="Tenure milestone savings" ref={revealAnchorRef}>
        {hiddenCards.map((card, lockedIndex) => {
          const revealed = phoneUnlocked && isLockedCardRevealed(lockedIndex);
          return (
            <li
              key={card.id}
              className={[
                'leak-results__hidden-line',
                revealed ? 'leak-results__hidden-line--revealed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="leak-results__hidden-line-label">{card.title}</span>
              <span
                className={[
                  'leak-results__hidden-line-amount',
                  !revealed ? 'leak-results__hidden-line-amount--locked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden={!revealed}
              >
                {revealed ? formatMoney(card.amount) : '$00,000'}
              </span>
            </li>
          );
        })}
      </ul>

      {showPostReveal && submittedEmail ? (
        <CalculatorScheduleCTA
          calculatorType="staffturnover"
          email={submittedEmail}
          name={submittedName}
          phone={submittedPhone}
        />
      ) : null}

      {!phoneUnlocked ? (
        <section className="leak-gate cta-box">
          <h3 className="leak-gate__headline">{HERO_LEAK_GATE_HEADLINE}</h3>
          <p className="leak-gate__body">{HERO_LEAK_GATE_BODY}</p>

          <form className="leak-gate__form" noValidate onSubmit={handleSubmit}>
            {!leadFromUrl ? (
              <JourneyLeadCaptureForm
                fullName={contact.fullName}
                email={contact.email}
                phone={contact.phone}
                onChange={onContactChange}
              />
            ) : null}

            {error ? <p className="leak-gate__error">{error}</p> : null}

            <button
              type="submit"
              className="leak-gate__cta"
              disabled={submitting}
              onFocus={() => onConsultationCta?.()}
            >
              {submitting ? 'Sending…' : 'Show Me Everything →'}
            </button>

            <ul className="leak-gate__checks">
              <li>Full tenure milestone savings breakdown</li>
              <li>Retention + revenue recovery deployment playbook</li>
            </ul>
          </form>
        </section>
      ) : null}
    </div>
  );
};

export default StaffTurnoverInlineReveal;
