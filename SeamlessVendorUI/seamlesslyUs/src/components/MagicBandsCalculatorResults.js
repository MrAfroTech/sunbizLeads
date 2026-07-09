import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import JourneyLeadCaptureForm from './JourneyLeadCaptureForm';
import DownloadReveal from './DownloadReveal';
import CalculatorHeroShell from './CalculatorHeroShell';
import {
  CALCULATOR_PAGE_KEYS,
  recordCalculatorPageVisit,
} from '../lib/calculatorPageVisits';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { buildMagicBandsEmailFields } from '../lib/calculatorEmailPersonalization';
import {
  hasLeadEmailInUrl,
  isContactComplete,
  parseContactFromSearchParams,
} from '../lib/journeyContactHelpers';

const LEAD_SOURCE = 'magic_bands_results';

const MAGIC_BANDS_BLUEPRINT_URL =
  process.env.REACT_APP_MAGIC_BANDS_BLUEPRINT_URL ||
  `${typeof window !== 'undefined' ? window.location.origin : 'https://www.seamlessly.us'}/magicBandsImplementationGuide.html`;

const MagicBandsCalculatorResults = () => {
  const [searchParams] = useSearchParams();
  const calculatorVisitIdRef = useRef(null);
  const leadFromUrl = useMemo(() => hasLeadEmailInUrl(searchParams), [searchParams]);

  const [contact, setContact] = useState({ fullName: '', email: '', phone: '' });
  const [contactError, setContactError] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [emailError, setEmailError] = useState('');

  const parsed = useMemo(() => {
    const amount = parseFloat(searchParams.get('amount')) || 0;
    const lostPerFan = parseFloat(searchParams.get('lost_per_fan')) || 0;
    const fans = parseFloat(searchParams.get('fans')) || 0;
    const parkingLoss = parseFloat(searchParams.get('parking_loss')) || 0;
    return { amount, lostPerFan, fans, parkingLoss };
  }, [searchParams]);

  useEffect(() => {
    if (leadFromUrl) {
      setContact(parseContactFromSearchParams(searchParams));
    }
  }, [leadFromUrl, searchParams]);

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.MAGIC_BANDS_RESULTS,
      searchParams,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [searchParams]);

  const handleContactChange = (field, value) => {
    setContact((c) => ({ ...c, [field]: value }));
  };

  const resolveContact = useCallback(
    () => (leadFromUrl ? parseContactFromSearchParams(searchParams) : contact),
    [leadFromUrl, searchParams, contact]
  );

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatMoneyDec = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const handleEmailResults = async () => {
    const contactPayload = resolveContact();

    if (!leadFromUrl && !isContactComplete(contactPayload)) {
      setContactError('Please enter your full name, a valid email, and a phone number (at least 7 digits).');
      return;
    }

    setContactError('');
    setEmailError('');
    setEmailBusy(true);

    try {
      const res = await fetch('/api/send-magic-bands-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactPayload.fullName || 'there',
          email: contactPayload.email,
          amount: parsed.amount,
          lostPerFan: parsed.lostPerFan,
          fans: parsed.fans,
          parkingLoss: parsed.parkingLoss,
          blueprintUrl: MAGIC_BANDS_BLUEPRINT_URL,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not send your results email.');
      }

      const campaign = 'magic-bands-results-email-blueprint';

      if (isContactComplete(contactPayload)) {
        await submitUnifiedLead({
          email: contactPayload.email,
          name: contactPayload.fullName,
          phone: contactPayload.phone,
          source: LEAD_SOURCE,
          campaign,
          visitId: calculatorVisitIdRef.current,
          visitContact: {
            name: contactPayload.fullName,
            email: contactPayload.email,
            phone: contactPayload.phone,
            lastClickCampaign: campaign,
          },
          calculatorEmailFields: buildMagicBandsEmailFields(parsed),
        });
      }

      setSubmittedEmail(contactPayload.email);
      setSubmittedName(contactPayload.fullName || '');
      setSubmittedPhone(contactPayload.phone || '');
      setEmailSent(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <CalculatorHeroShell>
      <div className="watch-vs-order-calc-body">
              <div className="watch-vs-order-result-block">
                <div className="watch-vs-order-result-sub">
                  That&apos;s real revenue your guests wanted to spend — but friction at the door or service point took off the table.
                </div>
                <div className="watch-vs-order-breakdown" style={{ marginTop: '16px' }}>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoney(parsed.amount)}</div>
                    <div className="watch-vs-order-breakdown-label">left on the table per event</div>
                  </div>
                  {parsed.parkingLoss > 0 ? (
                    <div className="watch-vs-order-breakdown-item">
                      <div className="watch-vs-order-breakdown-val">{formatMoney(parsed.parkingLoss)}</div>
                      <div className="watch-vs-order-breakdown-label">from parking friction (70% of attendance × fee)</div>
                    </div>
                  ) : null}
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoneyDec(parsed.lostPerFan)}</div>
                    <div className="watch-vs-order-breakdown-label">lost per affected guest</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{parsed.fans.toLocaleString()}</div>
                    <div className="watch-vs-order-breakdown-label">guests who didn&apos;t complete a purchase</div>
                  </div>
                </div>
              </div>

              <p
                className="watch-vs-order-result-sub"
                style={{ marginTop: '24px', fontSize: '1rem', color: 'rgba(245,236,215,0.85)' }}
              >
                MagicBands start by fixing flow at the door and parking. POS integration fixes flow at the bar.
              </p>

              {!leadFromUrl && !emailSent ? (
                <JourneyLeadCaptureForm
                  fullName={contact.fullName}
                  email={contact.email}
                  phone={contact.phone}
                  onChange={handleContactChange}
                />
              ) : null}
              {contactError ? (
                <p style={{ color: '#b91c1c', marginBottom: '12px', fontSize: '0.95rem' }}>{contactError}</p>
              ) : null}
              {emailError ? (
                <p style={{ color: '#b91c1c', marginBottom: '12px', fontSize: '0.95rem' }}>{emailError}</p>
              ) : null}
              {emailSent ? (
                <div style={{ marginTop: '16px' }}>
                  <DownloadReveal
                    email={submittedEmail || resolveContact().email}
                    name={submittedName || resolveContact().fullName}
                    phone={submittedPhone || resolveContact().phone}
                  />
                </div>
              ) : null}

              <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px' }}>
                {!emailSent ? (
                  <button
                    type="button"
                    className="watch-vs-order-cta-btn"
                    onClick={handleEmailResults}
                    disabled={emailBusy}
                  >
                    {emailBusy ? 'Sending…' : 'Email me my results with the standard blueprint'}
                  </button>
                ) : null}
              </div>

              <p style={{ marginTop: '24px' }}>
                <Link to="/calculator/magic-bands" className="watch-vs-order-cta-btn-secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Back to calculator
                </Link>
              </p>
      </div>
    </CalculatorHeroShell>
  );
};

export default MagicBandsCalculatorResults;
