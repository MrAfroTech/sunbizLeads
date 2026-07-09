import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import CalculatorHeroShell from './CalculatorHeroShell';
import JourneyLeadCaptureForm from './JourneyLeadCaptureForm';
import DownloadReveal from './DownloadReveal';
import { CALCULATOR_PAGE_KEYS, recordCalculatorPageVisit } from '../lib/calculatorPageVisits';
import { recordStaffBurnoutBackClick } from '../lib/staffJourneys';
import { buildStaffBurnoutEmailFields } from '../lib/calculatorEmailPersonalization';
import {
  hasLeadEmailInUrl,
  isContactComplete,
  parseContactFromSearchParams,
} from '../lib/journeyContactHelpers';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';

const LEAD_SOURCE = 'staff_burnout_calculator';

const INDUSTRY_AVERAGE_TENURE = 59;

const StaffBurnoutCalculatorResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const calculatorVisitIdRef = useRef(null);
  const { fire: fireEngagement, trackStartedOnce } = useLeadEventTracker(LEAD_SOURCE);

  const leadFromUrl = useMemo(() => hasLeadEmailInUrl(searchParams), [searchParams]);
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '' });
  const [backError, setBackError] = useState('');
  const [backBusy, setBackBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  useEffect(() => {
    if (leadFromUrl) {
      setContact(parseContactFromSearchParams(searchParams));
    }
  }, [leadFromUrl, searchParams]);

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.STAFF_BURNOUT_RESULTS,
      searchParams,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [searchParams]);

  const handleContactChange = (field, value) => {
    trackStartedOnce();
    setContact((c) => ({ ...c, [field]: value }));
  };

  const parsed = useMemo(() => {
    const turnoverCost = parseFloat(searchParams.get('turnover_cost')) || 0;
    const rehires = parseFloat(searchParams.get('rehires')) || 0;
    const monthlyCost = parseFloat(searchParams.get('monthly_cost')) || 0;
    const savingsRaw = searchParams.get('savings');
    const goalTenureRaw = searchParams.get('goal_tenure');
    return {
      turnoverCost,
      rehires,
      monthlyCost,
      savings: savingsRaw !== null && savingsRaw !== '' ? parseFloat(savingsRaw) : null,
      goalTenure: goalTenureRaw !== null && goalTenureRaw !== '' ? parseFloat(goalTenureRaw) : null,
    };
  }, [searchParams]);

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatNum = (n) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 2 });

  const showSavings = parsed.savings !== null && !Number.isNaN(parsed.savings) && parsed.goalTenure !== null && !Number.isNaN(parsed.goalTenure);

  const tenureDerived = useMemo(() => {
    if (!showSavings) return null;
    const extraDays = parsed.goalTenure - INDUSTRY_AVERAGE_TENURE;
    const rawAvoided = parsed.rehires * (extraDays / INDUSTRY_AVERAGE_TENURE);
    const rehiresAvoided = Math.min(Math.max(rawAvoided, 0), parsed.rehires);
    return { extraDays, rehiresAvoided };
  }, [showSavings, parsed.goalTenure, parsed.rehires]);

  const handleBackToCalculator = async () => {
    const contactPayload = leadFromUrl ? parseContactFromSearchParams(searchParams) : contact;

    if (!leadFromUrl && !isContactComplete(contactPayload)) {
      setBackError('Please enter your full name, a valid email, and a phone number (at least 7 digits).');
      return;
    }
    setBackError('');
    setBackBusy(true);
    fireEngagement('cta_clicked', 'interact');
    try {
      const queryParams = Object.fromEntries(searchParams.entries());
      const campaign =
        (searchParams.get('campaign') || '').trim() || 'staff-burnout-calculator-results';

      const leadResult = await submitUnifiedLead({
        email: contactPayload.email,
        name: contactPayload.fullName,
        phone: contactPayload.phone || null,
        source: LEAD_SOURCE,
        campaign,
        visitId: calculatorVisitIdRef.current,
        visitContact: {
          name: contactPayload.fullName,
          email: contactPayload.email,
          phone: contactPayload.phone,
          lastClickCampaign: campaign,
        },
        calculatorEmailFields: buildStaffBurnoutEmailFields(parsed),
      });

      if (!leadResult?.ok) {
        setBackError('Could not save your details. Please try again.');
        return;
      }

      fireEngagement('lead_submitted', 'submit', { email: contactPayload.email });
      if (contactPayload.phone) {
        fireEngagement('phone_provided', 'phone_provided', { email: contactPayload.email });
      }

      const ok = await recordStaffBurnoutBackClick({ contact: contactPayload, queryParams });
      if (ok) {
        setSubmittedEmail(contactPayload.email);
        setSubmittedName(contactPayload.fullName);
        setSubmittedPhone(contactPayload.phone || '');
        setSubmitted(true);
      } else {
        setBackError('Could not save your details. Check Supabase policies and the browser console.');
      }
    } finally {
      setBackBusy(false);
    }
  };

  return (
    <CalculatorHeroShell className="watch-vs-order-page--clear-navbar watch-vs-order-page--staffburnout">
      <div className="watch-vs-order-calc-body">
              <div className="watch-vs-order-result-block">
                <div className="watch-vs-order-result-sub">
                  You're losing {formatMoney(parsed.turnoverCost)} per year to staff turnover
                </div>
                <div className="watch-vs-order-result-sub" style={{ marginTop: '12px' }}>
                  That's {formatMoney(parsed.monthlyCost)} every month walking out the door
                </div>
              </div>

              {showSavings && tenureDerived && (
                <div className="watch-vs-order-result-block" style={{ marginTop: '24px' }}>
                  <div className="watch-vs-order-result-sub">
                    If you keep each employee just {tenureDerived.extraDays} days longer than average:
                  </div>
                  <div className="watch-vs-order-result-sub" style={{ marginTop: '12px' }}>
                    You avoid {formatNum(tenureDerived.rehiresAvoided)} turnover events per year
                  </div>
                  <div className="watch-vs-order-result-sub" style={{ marginTop: '12px' }}>
                    You save {formatMoney(parsed.savings)} annually
                  </div>
                </div>
              )}

              {!leadFromUrl && !submitted ? (
                <JourneyLeadCaptureForm
                  fullName={contact.fullName}
                  email={contact.email}
                  phone={contact.phone}
                  onChange={handleContactChange}
                />
              ) : null}
              {backError ? (
                <p style={{ color: '#b91c1c', marginBottom: '12px', fontSize: '0.95rem' }}>{backError}</p>
              ) : null}

              {submitted ? (
                <div style={{ marginTop: '24px' }}>
                  <DownloadReveal
                    email={submittedEmail}
                    name={submittedName}
                    phone={submittedPhone}
                  />
                </div>
              ) : null}

              <p style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="watch-vs-order-cta-btn"
                  style={{ display: 'inline-block', textDecoration: 'none', border: 'none', cursor: backBusy ? 'wait' : 'pointer' }}
                  disabled={backBusy}
                  onClick={() => {
                    if (submitted) {
                      navigate('/calculator/staffburnout');
                      return;
                    }
                    void handleBackToCalculator();
                  }}
                >
                  {backBusy ? 'Saving…' : submitted ? 'Back to calculator' : 'Save and continue'}
                </button>
              </p>
      </div>
    </CalculatorHeroShell>
  );
};

export default StaffBurnoutCalculatorResults;
