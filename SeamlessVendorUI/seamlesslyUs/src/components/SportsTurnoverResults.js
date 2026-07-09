import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import CalculatorHeroShell from './CalculatorHeroShell';
import {
  CALCULATOR_PAGE_KEYS,
  markCalculatorVisitReachedCheckout,
  recordCalculatorPageVisit,
} from '../lib/calculatorPageVisits';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import { hasLeadEmailInUrl, isContactComplete } from '../lib/journeyContactHelpers';
import { isContactCaptured, getStoredContactEmail } from '../lib/seamlesslyContactCapture';
import { parseTurnoverMetricsFromSearchParams } from '../lib/sportsTurnoverMath';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { buildSportsTurnoverEmailFields } from '../lib/calculatorEmailPersonalization';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import SportsCalculatorLeadModal, { useSportsCalculatorLeadModal } from './SportsCalculatorLeadModal';

const LEAD_SOURCE = 'sports_turnover_results';

const CALENDLY_STRATEGY_URL =
  process.env.REACT_APP_SPORTS_STRATEGY_CALENDLY_URL ||
  'https://calendly.com/staying-ahead-of-the-game/seamless-chat-clone';

const LEAD_MODAL_DELAY_MS = 5000;

const SportsTurnoverResults = () => {
  const [searchParams] = useSearchParams();
  const leadFromUrl = useMemo(() => hasLeadEmailInUrl(searchParams), [searchParams]);
  const { fire: fireEngagement } = useLeadEventTracker(LEAD_SOURCE);
  const calculatorVisitIdRef = useRef(null);
  const modalScheduledRef = useRef(false);
  const { isOpen: leadModalOpen, open: openLeadModal, close: closeLeadModal } = useSportsCalculatorLeadModal();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const metrics = useMemo(
    () => parseTurnoverMetricsFromSearchParams(searchParams),
    [searchParams]
  );

  const formatMoneyDec = (n) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const formatEmployees = (n) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const turnoverCopy = useMemo(
    () => ({
      totalAnnual: formatMoneyDec(metrics.totalAnnual),
      monthly: formatMoneyDec(metrics.monthly),
      employeesLost: formatEmployees(metrics.employeesLost),
    }),
    [metrics.employeesLost, metrics.monthly, metrics.totalAnnual]
  );

  const customerEmail =
    searchParams.get('email') || getStoredContactEmail() || '';

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.SPORTS_TURNOVER_RESULTS,
      searchParams,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [searchParams]);

  useEffect(() => {
    if (isContactCaptured() || modalScheduledRef.current) return undefined;

    modalScheduledRef.current = true;
    const timer = window.setTimeout(() => {
      openLeadModal();
    }, LEAD_MODAL_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [openLeadModal]);

  const runContactCaptureFlow = useCallback(
    (contactPayload) => {
      const campaign =
        (searchParams.get('campaign') || '').trim() || 'sports-turnover-results';

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: contactPayload,
          totalFans: metrics.employeesLost,
          averageOrderValue: metrics.costPerEmployee,
          percentNeverOrdered: 0,
        }),
      ];

      if (isContactComplete(contactPayload)) {
        captureTasks.push(
          submitUnifiedLead({
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
              lastClickCampaign: 'sports-turnover-results',
            },
            calculatorEmailFields: buildSportsTurnoverEmailFields(metrics),
          })
        );
      }

      return Promise.all(captureTasks).then((results) => {
        const funnel = results[results.length - 1];
        if (funnel && funnel.ok === false && funnel.error && funnel.error !== 'not_configured') {
          return { ok: false };
        }
        return { ok: true };
      });
    },
    [metrics, searchParams]
  );

  const handleLeadModalSubmit = useCallback(
    async (leadContact) => {
      const result = await runContactCaptureFlow(leadContact);
      if (result?.ok !== false) {
        fireEngagement('lead_submitted', 'submit');
        if (leadContact.phone) {
          fireEngagement('phone_provided', 'phone_provided');
        }
      }
      return result;
    },
    [runContactCaptureFlow, fireEngagement]
  );

  const handleGuideCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      await markCalculatorVisitReachedCheckout({
        id: calculatorVisitIdRef.current,
        email: customerEmail || undefined,
      });

      const res = await fetch('/api/calculator-plus-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueType: 'Stadium',
          dailyCovers: Math.round(metrics.employeesLost) || 0,
          avgOrderValue: metrics.costPerEmployee,
          missedRevenue: metrics.totalAnnual,
          customerEmail: customerEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.message || 'Checkout could not be started.');
      }
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err.message || 'Something went wrong. Please try again.');
      setCheckoutLoading(false);
    }
  };

  return (
    <CalculatorHeroShell>
      <div className="watch-vs-order-calc-body">
              <div className="watch-vs-order-result-block">
                <div className="watch-vs-order-result-sub">
                  This is what staying the course costs. Every year. Without a single bad hire.
                </div>
                <div className="watch-vs-order-breakdown" style={{ marginTop: '16px' }}>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatEmployees(metrics.employeesLost)}</div>
                    <div className="watch-vs-order-breakdown-label">employees lost per year</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoneyDec(metrics.costPerEmployee)}</div>
                    <div className="watch-vs-order-breakdown-label">cost per lost employee</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoneyDec(metrics.totalAnnual)}</div>
                    <div className="watch-vs-order-breakdown-label">total annual turnover cost</div>
                  </div>
                </div>
                <div className="watch-vs-order-breakdown" style={{ marginTop: '12px' }}>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoneyDec(metrics.threeYear)}</div>
                    <div className="watch-vs-order-breakdown-label">3-year compounding cost</div>
                  </div>
                  <div className="watch-vs-order-breakdown-item">
                    <div className="watch-vs-order-breakdown-val">{formatMoneyDec(metrics.monthly)}</div>
                    <div className="watch-vs-order-breakdown-label">monthly cost</div>
                  </div>
                </div>
              </div>

              <div
                className="sports-turnover-options"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '20px',
                  marginTop: '28px',
                }}
              >
                <div className="watch-vs-order-result-block" style={{ textAlign: 'left' }}>
                  <div
                    className="watch-vs-order-result-sub"
                    style={{
                      fontSize: '0.7rem',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      color: '#1a1a1a',
                      fontWeight: 700,
                      marginBottom: '8px',
                    }}
                  >
                    THE ROADMAP — $17
                  </div>
                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px', fontWeight: 700 }}>
                    Get The $17 Deployment Guide
                  </h3>
                  <p className="watch-vs-order-result-sub" style={{ marginBottom: '8px' }}>
                    Everything in a $500 consultation. In a document you own.
                  </p>
                  <p className="watch-vs-order-result-sub" style={{ marginBottom: '16px' }}>
                    Zone-by-zone deployment blueprint. Priority-ranked missed revenue opportunities.
                    Month-by-month ROI recovery timeline. Competitor benchmarking. Branded PDF you can
                    take into any meeting.
                  </p>
                  <button
                    type="button"
                    className="watch-vs-order-cta-btn"
                    onClick={handleGuideCheckout}
                    disabled={checkoutLoading}
                    style={{ width: '100%' }}
                  >
                    {checkoutLoading
                      ? 'Redirecting to checkout…'
                      : `Get the $17 that can save you ${turnoverCopy.monthly} per month`}
                  </button>
                  {checkoutError ? (
                    <p style={{ color: '#ff8a8a', fontSize: '0.85rem', marginTop: '8px' }}>{checkoutError}</p>
                  ) : null}
                </div>

                <div className="watch-vs-order-result-block" style={{ textAlign: 'left' }}>
                  <div
                    className="watch-vs-order-result-sub"
                    style={{
                      fontSize: '0.7rem',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      color: '#1a1a1a',
                      fontWeight: 700,
                      marginBottom: '8px',
                    }}
                  >
                    STRATEGY SESSION — FREE
                  </div>
                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px', fontWeight: 700 }}>
                    Book A Complimentary Strategy Session
                  </h3>
                  <p className="watch-vs-order-result-sub" style={{ marginBottom: '8px' }}>
                    Valued at $500. Yours at no cost.
                  </p>
                  <p className="watch-vs-order-result-sub" style={{ marginBottom: '16px' }}>
                    We&apos;ll walk through your specific venue, your turnover numbers, and your fastest path
                    to closing both gaps. No generic advice — built around what your calculator just told us.
                  </p>
                  <a
                    href={CALENDLY_STRATEGY_URL}
                    className="watch-vs-order-cta-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', width: '100%', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                  >
                    Book My Free Session
                  </a>
                </div>
              </div>

              <p style={{ marginTop: '24px' }}>
                <Link
                  to={`/calculator/sports/results?${searchParams.toString()}`}
                  className="watch-vs-order-cta-btn"
                  style={{ display: 'inline-block', textDecoration: 'none' }}
                >
                  Back to concession results
                </Link>
              </p>
      </div>
      <SportsCalculatorLeadModal
        isOpen={leadModalOpen}
        onClose={closeLeadModal}
        onLeadSubmit={handleLeadModalSubmit}
        leadFromUrl={leadFromUrl}
        searchParams={searchParams}
        turnoverCopy={turnoverCopy}
      />
    </CalculatorHeroShell>
  );
};

export default SportsTurnoverResults;
