import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/CalculatorGlassCard.css';
import '../styles/CalculatorRangeField.css';
import SportsGatedCalculatorResults from './SportsGatedCalculatorResults';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import {
  CALCULATOR_PAGE_KEYS,
  recordCalculatorPageVisit,
  syncVisitAfterContactSubmit,
} from '../lib/calculatorPageVisits';
import { buildSports2RetentionEmailFields } from '../lib/calculatorEmailPersonalization';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import {
  buildSports2LockedCards,
  computeSports2RetentionMetrics,
} from '../lib/sports2RetentionCalculatorMath';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { sendSportsHeyyouPdf } from '../lib/sendSportsHeyyouPdf';
import CalculatorRangeField from './CalculatorRangeField';
import { CALCULATOR_RANGE_FIELDS } from '../lib/calculatorRangeConfig';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  scheduleFormSubmit,
} from './CalculatorStepFlow';

const LEAD_SOURCE = 'sports2_calculator';
const LEAD_CAMPAIGN = 'sports2-retention-calculator';
const TOTAL_STEPS = 4;
const STEP_FIELDS = ['tickets', 'package', 'renewal', 'tenure'];

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    n || 0
  );

const Sports2RetentionCalculator = () => {
  const [searchParams] = useSearchParams();
  const { fire: fireEngagement, trackStartedOnce } = useLeadEventTracker(LEAD_SOURCE);
  const calculatorVisitIdRef = useRef(null);
  const formRef = useRef(null);

  const [totalSeasonTickets, setTotalSeasonTickets] = useState('4000');
  const [avgTicketPackageValue, setAvgTicketPackageValue] = useState('1200');
  const [currentRenewalRate, setCurrentRenewalRate] = useState('78');
  const [avgTenureYears, setAvgTenureYears] = useState('3.2');
  const [resultsShown, setResultsShown] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepField = STEP_FIELDS[currentStep];

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.SPORTS2_CALCULATOR,
      searchParams,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [searchParams]);

  useEffect(() => {
    if (resultsShown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [resultsShown]);

  const lockedCards = useMemo(
    () => (snapshot ? buildSports2LockedCards(snapshot, formatMoney) : []),
    [snapshot]
  );

  const handleCalculate = (ev) => {
    ev.preventDefault();

    const tickets = parseFloat(totalSeasonTickets);
    const packageValue = parseFloat(avgTicketPackageValue);
    const renewal = parseFloat(currentRenewalRate);
    const tenure = parseFloat(avgTenureYears);

    if (
      !Number.isFinite(tickets) ||
      tickets <= 0 ||
      !Number.isFinite(packageValue) ||
      packageValue <= 0 ||
      !Number.isFinite(renewal) ||
      renewal < 50 ||
      renewal > 99 ||
      !Number.isFinite(tenure) ||
      tenure <= 0
    ) {
      return;
    }

    const metrics = computeSports2RetentionMetrics({
      totalSeasonTickets: tickets,
      avgTicketPackageValue: packageValue,
      currentRenewalRate: renewal,
      avgTenureYears: tenure,
    });

    setSnapshot(metrics);
    setResultsShown(true);
    fireEngagement('calculator_completed', 'interact');
  };

  const validateCurrentStep = () => {
    if (currentStepField === 'tickets') {
      const tickets = parseFloat(totalSeasonTickets);
      if (!Number.isFinite(tickets) || tickets <= 0) return false;
    }
    if (currentStepField === 'package') {
      const packageValue = parseFloat(avgTicketPackageValue);
      if (!Number.isFinite(packageValue) || packageValue <= 0) return false;
    }
    if (currentStepField === 'renewal') {
      const renewal = parseFloat(currentRenewalRate);
      if (!Number.isFinite(renewal) || renewal < 50 || renewal > 99) return false;
    }
    if (currentStepField === 'tenure') {
      const tenure = parseFloat(avgTenureYears);
      if (!Number.isFinite(tenure) || tenure <= 0) return false;
    }
    return true;
  };

  const handleStepNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS - 1));
  };

  const handleStepBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const runContactCaptureFlow = useCallback(
    (contactPayload) => {
      const metrics =
        snapshot ||
        computeSports2RetentionMetrics({
          totalSeasonTickets,
          avgTicketPackageValue,
          currentRenewalRate,
          avgTenureYears,
        });

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: {
            fullName: contactPayload.firstName,
            email: contactPayload.email,
            phone: contactPayload.phone,
          },
          totalFans: metrics.totalSeasonTickets,
          averageOrderValue: metrics.avgTicketPackageValue,
          percentNeverOrdered: Math.round(100 - metrics.currentRenewalRate),
          leadScore: 50,
        }),
        submitUnifiedLead({
          email: contactPayload.email,
          name: contactPayload.firstName,
          phone: contactPayload.phone,
          source: LEAD_SOURCE,
          campaign: LEAD_CAMPAIGN,
          visitId: calculatorVisitIdRef.current,
          visitContact: {
            name: `${contactPayload.firstName} — ${contactPayload.venueName}`,
            email: contactPayload.email,
            phone: contactPayload.phone,
            lastClickCampaign: LEAD_CAMPAIGN,
            leadScore: 50,
          },
          calculatorEmailFields: buildSports2RetentionEmailFields(metrics),
        }),
        sendSportsHeyyouPdf({
          name: contactPayload.firstName,
          email: contactPayload.email,
          venueName: contactPayload.venueName,
          leftOnTable: metrics.annual_revenue_lost,
        }),
      ];

      return Promise.all(captureTasks).then((results) => {
        const pdfResult = results[2];
        const leadResult = results[1];
        if (pdfResult?.ok === false) {
          // eslint-disable-next-line no-console
          console.warn('[sports2 calculator] PDF email failed:', pdfResult.error);
        }
        if (leadResult?.ok === false && leadResult.error && leadResult.error !== 'not_configured') {
          return { ok: false };
        }
        return { ok: true };
      });
    },
    [snapshot, totalSeasonTickets, avgTicketPackageValue, currentRenewalRate, avgTenureYears]
  );

  const handleReportSubmit = useCallback(
    async (contact) => {
      fireEngagement('cta_clicked', 'interact', { email: contact.email });
      const captureResult = await runContactCaptureFlow(contact);
      if (captureResult?.ok === false) {
        return { ok: false };
      }
      fireEngagement('lead_submitted', 'submit', { email: contact.email });
      fireEngagement('phone_provided', 'phone_provided', { email: contact.email });
      void syncVisitAfterContactSubmit({
        id: calculatorVisitIdRef.current,
        contact,
        leadScore: 50,
      });
      return { ok: true };
    },
    [fireEngagement, runContactCaptureFlow]
  );

  const handleConsultationCta = useCallback(() => {
    fireEngagement('consultation_cta_clicked', 'interact');
  }, [fireEngagement]);

  return (
    <CalculatorHeroShell glassCard>
      {!resultsShown ? (
        <form ref={formRef} className="watch-vs-order-calc-body" onSubmit={handleCalculate}>
          <CalculatorHeroCardIntro
            eyebrow="The renewal gap your revenue team hasn't priced yet"
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
          />

          <CalculatorStepChrome currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                    {currentStepField === 'tickets' ? (
                      <CalculatorRangeField
                        id="sports2-tickets"
                        label="How many season tickets did you sell this year?"
                        value={totalSeasonTickets}
                        onChange={(nextValue) => {
                          trackStartedOnce();
                          setTotalSeasonTickets(nextValue);
                        }}
                        onFocus={trackStartedOnce}
                        {...CALCULATOR_RANGE_FIELDS.seasonTickets}
                      />
                    ) : null}

                    {currentStepField === 'package' ? (
                      <CalculatorRangeField
                        id="sports2-package"
                        label="What's the average annual value of a season ticket package?"
                        value={avgTicketPackageValue}
                        onChange={(nextValue) => {
                          trackStartedOnce();
                          setAvgTicketPackageValue(nextValue);
                        }}
                        onFocus={trackStartedOnce}
                        {...CALCULATOR_RANGE_FIELDS.ticketPackage}
                      />
                    ) : null}

                    {currentStepField === 'renewal' ? (
                      <CalculatorRangeField
                        id="sports2-renewal"
                        label="What's your current renewal rate? (industry avg is 78%)"
                        value={currentRenewalRate}
                        onChange={(nextValue) => {
                          trackStartedOnce();
                          setCurrentRenewalRate(nextValue);
                        }}
                        onFocus={trackStartedOnce}
                        defaultValue={78}
                        {...CALCULATOR_RANGE_FIELDS.renewalRate}
                      />
                    ) : null}

                    {currentStepField === 'tenure' ? (
                      <CalculatorRangeField
                        id="sports2-tenure"
                        label="On average, how many years does a holder stay before they lapse?"
                        value={avgTenureYears}
                        onChange={(nextValue) => {
                          trackStartedOnce();
                          setAvgTenureYears(nextValue);
                        }}
                        onFocus={trackStartedOnce}
                        defaultValue={3.2}
                        onBlur={() => {
                          if (currentStep === TOTAL_STEPS - 1 && validateCurrentStep()) {
                            scheduleFormSubmit(formRef);
                          }
                        }}
                        {...CALCULATOR_RANGE_FIELDS.tenureYears}
                      />
                    ) : null}

                    <CalculatorStepNav
                      showBack={currentStep > 0}
                      onBack={handleStepBack}
                      onNext={handleStepNext}
                      isLastStep={currentStep === TOTAL_STEPS - 1}
                      submitLabel="Show Me What Lapsed Holders Are Costing Me"
                    />
        </form>
      ) : null}

      {resultsShown && snapshot ? (
        <SportsGatedCalculatorResults
          calculatorType="sports2"
          formatMoney={formatMoney}
          lockedCards={lockedCards}
          totalAmount={snapshot.annual_revenue_lost}
          totalBannerLabel="Total annual retention gap"
          totalBannerSubline="This is what your renewal rate is costing you every season — before lifetime value."
          heroHeadline={
            <>
              ANNUAL REVENUE AT RISK FROM NON-RENEWALS:{' '}
              <span className="leak-results__hero-card-figure">
                {formatMoney(snapshot.annual_revenue_lost)}
              </span>
            </>
          }
          heroSubhead="Based on your current renewal rate and package value"
          gateChecks={[
            'Full breakdown of all retention gaps',
            '1 actionable fix you can put in place before renewal season',
          ]}
          onReportSubmit={handleReportSubmit}
          onConsultationCta={handleConsultationCta}
          gridAriaLabel="Season ticket retention breakdown"
        />
      ) : null}
    </CalculatorHeroShell>
  );
};

export default Sports2RetentionCalculator;
