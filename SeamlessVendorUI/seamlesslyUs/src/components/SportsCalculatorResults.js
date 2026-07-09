import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import CalculatorHeroShell from './CalculatorHeroShell';
import SportsCalculatorInlineResults from './SportsCalculatorInlineResults';
import {
  CALCULATOR_PAGE_KEYS,
  recordCalculatorPageVisit,
} from '../lib/calculatorPageVisits';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import {
  appendContactToSearchParams,
  hasLeadEmailInUrl,
  isContactComplete,
  parseContactFromSearchParams,
} from '../lib/journeyContactHelpers';
import { isContactCaptured } from '../lib/seamlesslyContactCapture';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { buildSportsGameEmailFields } from '../lib/calculatorEmailPersonalization';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import SportsCalculatorLeadModal, { useSportsCalculatorLeadModal } from './SportsCalculatorLeadModal';

const LEAD_SOURCE = 'sports_results';
const LEAD_MODAL_DELAY_MS = 5000;

const SportsCalculatorResults = () => {
  const [searchParams] = useSearchParams();
  const leadFromUrl = useMemo(() => hasLeadEmailInUrl(searchParams), [searchParams]);
  const { fire: fireEngagement } = useLeadEventTracker(LEAD_SOURCE);
  const calculatorVisitIdRef = useRef(null);
  const modalScheduledRef = useRef(false);
  const { isOpen: leadModalOpen, open: openLeadModal, close: closeLeadModal } = useSportsCalculatorLeadModal();

  const parsed = useMemo(() => {
    const amount = parseFloat(searchParams.get('amount')) || 0;
    const lostPerFan = parseFloat(searchParams.get('lost_per_fan')) || 0;
    const fans = parseFloat(searchParams.get('fans')) || 0;
    return { amount, lostPerFan, fans };
  }, [searchParams]);

  const snapshot = useMemo(
    () => ({
      leftOnTable: parsed.amount,
      lostPerFan: parsed.lostPerFan,
      fansWhoNeverOrdered: parsed.fans,
    }),
    [parsed.amount, parsed.fans, parsed.lostPerFan]
  );

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatMoneyDec = (n) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const formatFans = (n) => Math.round(n).toLocaleString('en-US');

  const resultsCopy = useMemo(
    () => ({
      amount: formatMoney(parsed.amount),
      fans: formatFans(parsed.fans),
      lostPerFan: formatMoneyDec(parsed.lostPerFan),
    }),
    [parsed.amount, parsed.fans, parsed.lostPerFan]
  );

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.SPORTS_RESULTS,
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
        (searchParams.get('campaign') || '').trim() || 'sports-calculator-results';

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: contactPayload,
          totalFans: parsed.fans,
          averageOrderValue: parsed.lostPerFan,
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
              lastClickCampaign: 'sports-calculator-results',
            },
            calculatorEmailFields: buildSportsGameEmailFields({ leftOnTable: parsed.amount }),
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
    [parsed.amount, parsed.fans, parsed.lostPerFan, searchParams]
  );

  const handleLeadModalSubmit = useCallback(
    async (leadContact) => {
      const captureResult = await runContactCaptureFlow(leadContact);
      if (captureResult?.ok === false) {
        return { ok: false };
      }
      fireEngagement('lead_submitted', 'submit');
      if (leadContact.phone) {
        fireEngagement('phone_provided', 'phone_provided');
      }
      return { ok: true };
    },
    [runContactCaptureFlow, fireEngagement]
  );

  const handleReportSubmit = useCallback(
    async ({ firstName, email, phone, venueName }) => {
      const captureResult = await runContactCaptureFlow({
        fullName: firstName,
        email,
        phone,
        venueName,
      });
      if (captureResult?.ok === false) {
        return { ok: false };
      }
      fireEngagement('lead_submitted', 'submit');
      if (phone) {
        fireEngagement('phone_provided', 'phone_provided');
      }
      return { ok: true };
    },
    [runContactCaptureFlow, fireEngagement]
  );

  const turnoverHref = useMemo(() => {
    const qs = new URLSearchParams(searchParams);
    appendContactToSearchParams(qs, parseContactFromSearchParams(searchParams));
    return `/calculator/sports/results/turnover?${qs.toString()}`;
  }, [searchParams]);

  return (
    <CalculatorHeroShell>
      <SportsCalculatorInlineResults
        snapshot={snapshot}
        formatMoney={formatMoney}
        onReportSubmit={handleReportSubmit}
        onConsultationCta={() => fireEngagement('consultation_cta_clicked', 'interact')}
      />
      <p style={{ marginTop: '16px', marginBottom: 0 }}>
        <Link
          to={turnoverHref}
          className="watch-vs-order-cta-btn"
          style={{ display: 'inline-block', textDecoration: 'none', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
        >
          Calculate staff turnover cost →
        </Link>
      </p>
      <p style={{ marginTop: '12px', marginBottom: 0 }}>
        <Link to="/calculator/sports" className="watch-vs-order-cta-btn-secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Back to calculator
        </Link>
      </p>
      <SportsCalculatorLeadModal
        isOpen={leadModalOpen}
        onClose={closeLeadModal}
        onLeadSubmit={handleLeadModalSubmit}
        leadFromUrl={leadFromUrl}
        searchParams={searchParams}
        resultsCopy={resultsCopy}
      />
    </CalculatorHeroShell>
  );
};

export default SportsCalculatorResults;
