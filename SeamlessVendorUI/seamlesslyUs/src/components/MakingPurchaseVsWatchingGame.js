import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import SportsCalculatorInlineResults from './SportsCalculatorInlineResults';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import {
  CALCULATOR_PAGE_KEYS,
  recordCalculatorPageVisit,
  updateCalculatorPageVisitAttribution,
} from '../lib/calculatorPageVisits';
import {
  computeSportsLeadScore,
  HERO_ORDERING_OPTIONS,
  HERO_SPORTS_VENUE_OPTIONS,
} from '../lib/calculatorLeadScore';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import { computeWaitCalculatorMetrics } from '../lib/waitCalculatorMath';
import { resolveKnownLeadIdentity } from '../lib/leadIdentity';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { buildSportsGameEmailFields } from '../lib/calculatorEmailPersonalization';
import { sendSportsHeyyouPdf } from '../lib/sendSportsHeyyouPdf';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  CalculatorSingleSelectButtons,
  useCalculatorAutoAdvance,
} from './CalculatorStepFlow';
import { CALCULATOR_BUCKETS } from '../lib/calculatorBucketOptions';

const LEAD_SOURCE = 'sports_calculator';
const BENCHMARK_NON_ORDER_RATE = 45;
const TOTAL_STEPS = 4;
const SPORTS_BUCKETS = CALCULATOR_BUCKETS.sports;

const MakingPurchaseVsWatchingGame = () => {
  const [searchParams] = useSearchParams();
  const { fire: fireEngagement, trackStartedOnce } = useLeadEventTracker(LEAD_SOURCE);

  const sportsJourneyIdRef = useRef(null);
  const calculatorVisitIdRef = useRef(null);
  const formRef = useRef(null);

  const [venueType, setVenueType] = useState('');
  const [orderingMethod, setOrderingMethod] = useState('');
  const [qualificationError, setQualificationError] = useState('');
  const [totalFans, setTotalFans] = useState('');
  const [averageOrderValue, setAverageOrderValue] = useState('');
  const [resultsShown, setResultsShown] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { advanceAfterSelect } = useCalculatorAutoAdvance({
    currentStep,
    totalSteps: TOTAL_STEPS,
    setCurrentStep,
    onClearError: () => setQualificationError(''),
    onComplete: () => formRef.current?.requestSubmit(),
  });

  const leadScore = useMemo(
    () =>
      computeSportsLeadScore({
        venueType: venueType || undefined,
        orderingMethod: orderingMethod || undefined,
      }),
    [venueType, orderingMethod]
  );

  const knownIdentity = useMemo(
    () => resolveKnownLeadIdentity(searchParams),
    [searchParams]
  );

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.SPORTS_CALCULATOR,
      searchParams,
      persona: venueType || undefined,
      orderingMethod: orderingMethod || undefined,
      leadScore,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [searchParams]);

  useEffect(() => {
    const visitId = calculatorVisitIdRef.current;
    if (!visitId) return;

    void updateCalculatorPageVisitAttribution({
      id: visitId,
      name: knownIdentity.name || undefined,
      email: knownIdentity.email || undefined,
      phone: knownIdentity.phone || undefined,
      persona: venueType || undefined,
      orderingMethod: orderingMethod || undefined,
      leadScore,
    });
  }, [venueType, orderingMethod, leadScore, knownIdentity]);

  useEffect(() => {
    if (resultsShown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [resultsShown]);

  const formatMoney = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const formatMoneyDec = (n) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const handleCalculate = (ev) => {
    ev.preventDefault();
    setQualificationError('');

    if (!venueType) {
      setQualificationError('Please select what best describes your venue.');
      return;
    }
    if (!orderingMethod) {
      setQualificationError('Please select how guests currently order.');
      return;
    }

    const attendance = parseFloat(totalFans);
    const spend = parseFloat(averageOrderValue);
    if (!Number.isFinite(attendance) || attendance <= 0 || !Number.isFinite(spend) || spend <= 0) {
      return;
    }

    const metrics = computeWaitCalculatorMetrics({
      peakNightCustomers: attendance,
      averageSpendPerCustomer: spend,
    });

    setSnapshot({
      fansWhoNeverOrdered: metrics.customersWhoWaited,
      leftOnTable: metrics.missedRevenueThatNight,
      lostPerFan: spend,
    });
    setResultsShown(true);
    fireEngagement('calculator_completed', 'interact');
  };

  const validateCurrentStep = () => {
    setQualificationError('');

    if (currentStep === 0) {
      if (!venueType) {
        setQualificationError('Please select what best describes your venue.');
        return false;
      }
      return true;
    }

    if (currentStep === 1) {
      if (!orderingMethod) {
        setQualificationError('Please select how guests currently order.');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      const attendance = parseFloat(totalFans);
      if (!Number.isFinite(attendance) || attendance <= 0) {
        return false;
      }
      return true;
    }

    const spend = parseFloat(averageOrderValue);
    if (!Number.isFinite(spend) || spend <= 0) {
      return false;
    }
    return true;
  };

  const handleStepNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS - 1));
  };

  const handleStepBack = () => {
    setQualificationError('');
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const runContactCaptureFlow = useCallback(
    (contactPayload) => {
      const attendance = parseFloat(totalFans) || 0;
      const spend = parseFloat(averageOrderValue) || 0;
      const finalScore = computeSportsLeadScore({
        venueType,
        orderingMethod,
        milestones: ['calculator_completed', 'lead_submitted'],
      });

      const leftOnTable =
        snapshot?.leftOnTable ??
        computeWaitCalculatorMetrics({
          peakNightCustomers: attendance,
          averageSpendPerCustomer: spend,
        }).missedRevenueThatNight;

      const campaign =
        (searchParams.get('campaign') || '').trim() || 'sports-calculator-calculate';

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: {
            fullName: contactPayload.fullName || contactPayload.firstName,
            email: contactPayload.email,
            phone: contactPayload.phone,
          },
          totalFans: attendance,
          averageOrderValue: spend,
          percentNeverOrdered: BENCHMARK_NON_ORDER_RATE,
          persona: venueType,
          orderingMethod,
          leadScore: finalScore,
        }),
        submitUnifiedLead({
          email: contactPayload.email,
          name: contactPayload.fullName || contactPayload.firstName,
          phone: contactPayload.phone,
          source: LEAD_SOURCE,
          campaign,
          visitId: calculatorVisitIdRef.current,
          visitContact: {
            name: contactPayload.venueName
              ? `${contactPayload.fullName || contactPayload.firstName} — ${contactPayload.venueName}`
              : contactPayload.fullName || contactPayload.firstName,
            email: contactPayload.email,
            phone: contactPayload.phone,
            lastClickCampaign: 'sports-calculator',
            persona: venueType,
            orderingMethod,
            leadScore: finalScore,
          },
          calculatorEmailFields: buildSportsGameEmailFields({ leftOnTable }),
        }),
        sendSportsHeyyouPdf({
          name: contactPayload.fullName || contactPayload.firstName,
          email: contactPayload.email,
          venueName: contactPayload.venueName,
          leftOnTable,
        }),
      ];

      return Promise.all(captureTasks).then((results) => {
        const journeyId = results[0];
        const pdfResult = results[results.length - 1];
        const funnel = results[results.length - 2];
        if (journeyId) sportsJourneyIdRef.current = journeyId;
        if (pdfResult && pdfResult.ok === false) {
          return { ok: false };
        }
        if (funnel && funnel.ok === false && funnel.error && funnel.error !== 'not_configured') {
          return { ok: false };
        }
        return { ok: true };
      });
    },
    [totalFans, averageOrderValue, venueType, orderingMethod, searchParams, snapshot]
  );

  const handleReportSubmit = useCallback(
    async ({ firstName, email, phone, venueName }) => {
      fireEngagement('cta_clicked', 'interact');
      const captureResult = await runContactCaptureFlow({
        fullName: firstName,
        firstName,
        email,
        phone,
        venueName,
      });
      if (captureResult?.ok === false) {
        return { ok: false };
      }
      fireEngagement('lead_submitted', 'submit');
      fireEngagement('phone_provided', 'phone_provided');
      return { ok: true };
    },
    [runContactCaptureFlow, fireEngagement]
  );

  const handleConsultationCta = useCallback(() => {
    fireEngagement('consultation_cta_clicked', 'interact');
  }, [fireEngagement]);

  return (
    <CalculatorHeroShell>
      {!resultsShown ? (
        <form ref={formRef} className="watch-vs-order-calc-body" onSubmit={handleCalculate}>
          <CalculatorHeroCardIntro
            eyebrow="Revenue Intelligence"
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
          />

          <CalculatorStepChrome currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          {currentStep === 0 ? (
            <div className="watch-vs-order-field-group">
              <label className="watch-vs-order-field-label" htmlFor="sports-calc-venue">
                What best describes your venue?
              </label>
              <CalculatorSingleSelectButtons
                name="venueType"
                options={HERO_SPORTS_VENUE_OPTIONS}
                value={venueType}
                onChange={setVenueType}
                onSelect={() => trackStartedOnce()}
                autoAdvance
                onAdvance={advanceAfterSelect}
              />
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="watch-vs-order-field-group">
              <label className="watch-vs-order-field-label" htmlFor="sports-calc-ordering">
                How do guests currently order?
              </label>
              <CalculatorSingleSelectButtons
                name="orderingMethod"
                options={HERO_ORDERING_OPTIONS}
                value={orderingMethod}
                onChange={setOrderingMethod}
                onSelect={() => trackStartedOnce()}
                autoAdvance
                onAdvance={advanceAfterSelect}
              />
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="watch-vs-order-field-group">
              <label className="watch-vs-order-field-label" htmlFor="sports-calc-attendance">
                Average attendance on peak nights
              </label>
              <CalculatorSingleSelectButtons
                name="peakNightAttendance"
                options={SPORTS_BUCKETS.volume}
                value={totalFans}
                onChange={setTotalFans}
                onSelect={() => trackStartedOnce()}
                autoAdvance
                onAdvance={advanceAfterSelect}
              />
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="watch-vs-order-field-group">
              <label className="watch-vs-order-field-label" htmlFor="sports-calc-spend">
                Average spend per guest
              </label>
              <CalculatorSingleSelectButtons
                name="averageSpendPerGuest"
                options={SPORTS_BUCKETS.spend}
                value={averageOrderValue}
                onChange={setAverageOrderValue}
                onSelect={() => trackStartedOnce()}
                autoAdvance
                onAdvance={advanceAfterSelect}
              />
            </div>
          ) : null}

          {qualificationError ? (
            <p className="watch-vs-order-field-label" role="alert">
              {qualificationError}
            </p>
          ) : null}

          <CalculatorStepNav
            showBack={currentStep > 0}
            onBack={handleStepBack}
            onNext={handleStepNext}
            isLastStep={currentStep === TOTAL_STEPS - 1}
            submitLabel="Show Me What I'm Leaving on the Table"
          />
        </form>
      ) : null}

      {resultsShown && snapshot ? (
        <SportsCalculatorInlineResults
          snapshot={snapshot}
          formatMoney={formatMoney}
          onReportSubmit={handleReportSubmit}
          onConsultationCta={handleConsultationCta}
        />
      ) : null}
    </CalculatorHeroShell>
  );
};

export default MakingPurchaseVsWatchingGame;
