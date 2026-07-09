import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import CalculatorLeakResults from './CalculatorLeakResults';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import { pickHeroResultCards } from '../lib/heroResultCards';
import { VISIBLE_LEAK_MOMENT_ID } from '../lib/leakReportMoments';
import {
  resolveAbVariant,
  syncAbVariantInSearchParams,
  VARIANT_COPY,
  VARIANT_PRE_HEADLINE,
} from '../lib/calculatorAbTest';
import {
  computeEventLeadScore,
  HANDOFF_QUALITY_OPTIONS,
  PLANNER_TYPE_OPTIONS,
} from '../lib/eventCalculatorLeadScore';
import {
  computeGuestExperienceGapMetrics,
  computeGuestExperienceGapMomentAmounts,
} from '../lib/eventCalculatorMath';
import {
  recordCalculatorPageVisit,
  updateCalculatorPageVisitAttribution,
} from '../lib/calculatorPageVisits';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import { buildEventEmailFields } from '../lib/calculatorEmailPersonalization';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { sendEventsHeyyouPdf } from '../lib/sendEventsHeyyouPdf';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { resolveKnownLeadIdentity } from '../lib/leadIdentity';
import {
  hasEventCalculatorInputsInUrl,
  parseEventCalculatorInputsFromSearchParams,
} from '../lib/journeyContactHelpers';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  CalculatorSingleSelectButtons,
  useCalculatorAutoAdvance,
} from './CalculatorStepFlow';
import { CALCULATOR_BUCKETS } from '../lib/calculatorBucketOptions';

const EVENT_BUCKETS = CALCULATOR_BUCKETS.events;

const EVENT_STAT_CARDS = [
  {
    value: '45%',
    label: 'of guest preferences lost when briefed verbally day-of',
  },
  {
    value: '18%',
    label: 'of event fee value at risk when a VIP goes unrecognized',
  },
  {
    value: '60%',
    label: 'of planner revenue typically driven by referrals and repeats',
  },
];

const VENUE_LEAK_PAGE_KEYS = new Set([
  'wait_calculator',
  'restaurants_calculator',
  'hotels_calculator',
  'events_calculator',
]);

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const TOTAL_STEPS = 4;
const STEP_FIELDS = ['plannerType', 'handoffQuality', 'eventsPerYear', 'avgEventFee'];

const EventLeakCalculator = ({
  pageKey,
  leadCampaign,
  idPrefix = 'events-calc',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const calculatorVisitIdRef = useRef(null);
  const urlResultsAppliedRef = useRef(false);
  const milestonesRef = useRef(new Set());
  const formRef = useRef(null);
  const [milestoneVersion, setMilestoneVersion] = useState(0);
  const { fire: fireEngagement } = useLeadEventTracker(pageKey);

  const abVariant = useMemo(() => resolveAbVariant(searchParams), [searchParams]);
  const copy = VARIANT_COPY[abVariant] ?? VARIANT_COPY.a;

  const [plannerType, setPlannerType] = useState('');
  const [handoffQuality, setHandoffQuality] = useState('');
  const [qualificationError, setQualificationError] = useState('');
  const [eventsPerYear, setEventsPerYear] = useState('');
  const [avgEventFee, setAvgEventFee] = useState('');
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
  const currentStepField = STEP_FIELDS[currentStep];

  const leadScore = useMemo(
    () =>
      computeEventLeadScore({
        plannerType: plannerType || undefined,
        handoffQuality: handoffQuality || undefined,
        milestones: milestonesRef.current,
      }),
    [plannerType, handoffQuality, milestoneVersion]
  );

  const knownIdentity = useMemo(
    () => resolveKnownLeadIdentity(searchParams),
    [searchParams]
  );

  useEffect(() => {
    const inputs = parseEventCalculatorInputsFromSearchParams(searchParams);
    if (inputs.plannerType) setPlannerType(inputs.plannerType);
    if (inputs.handoffQuality) setHandoffQuality(inputs.handoffQuality);
    if (inputs.eventsPerYear) setEventsPerYear(inputs.eventsPerYear);
    if (inputs.avgEventFee) setAvgEventFee(inputs.avgEventFee);

    if (urlResultsAppliedRef.current || !hasEventCalculatorInputsInUrl(searchParams)) return;

    urlResultsAppliedRef.current = true;
    const metrics = computeGuestExperienceGapMetrics({
      plannerType: inputs.plannerType,
      handoffQuality: inputs.handoffQuality,
      eventsPerYear: inputs.eventsPerYear,
      avgEventFee: inputs.avgEventFee,
    });
    setSnapshot(metrics);
    setResultsShown(true);
  }, [searchParams]);

  useEffect(() => {
    syncAbVariantInSearchParams(searchParams, setSearchParams, abVariant);
  }, [abVariant, searchParams, setSearchParams]);

  const persistAttribution = useCallback(
    (nextMilestones) => {
      const visitId = calculatorVisitIdRef.current;
      if (!visitId) return;

      const score = computeEventLeadScore({
        plannerType: plannerType || undefined,
        handoffQuality: handoffQuality || undefined,
        milestones: nextMilestones ?? milestonesRef.current,
      });

      void updateCalculatorPageVisitAttribution({
        id: visitId,
        name: knownIdentity.name || undefined,
        email: knownIdentity.email || undefined,
        phone: knownIdentity.phone || undefined,
        abVariant,
        persona: plannerType || undefined,
        orderingMethod: handoffQuality || undefined,
        leadScore: score,
      });
    },
    [abVariant, plannerType, handoffQuality, knownIdentity]
  );

  const buildAttributionPayload = useCallback(
    (milestones = milestonesRef.current) => ({
      visit_id: calculatorVisitIdRef.current || undefined,
      ...knownIdentity,
      ab_variant: abVariant,
      persona: plannerType || null,
      ordering_method: handoffQuality || null,
      lead_score: computeEventLeadScore({
        plannerType: plannerType || undefined,
        handoffQuality: handoffQuality || undefined,
        milestones,
      }),
    }),
    [abVariant, plannerType, handoffQuality, knownIdentity]
  );

  const engagementTypeForMilestone = (eventType) => {
    if (eventType === 'lead_submitted') return 'submit';
    if (eventType === 'phone_provided' || eventType === 'consultation_booked') return 'phone_provided';
    return 'interact';
  };

  const recordMilestone = useCallback(
    (eventType) => {
      if (milestonesRef.current.has(eventType)) return;
      milestonesRef.current.add(eventType);
      setMilestoneVersion((version) => version + 1);
      fireEngagement(
        eventType,
        engagementTypeForMilestone(eventType),
        buildAttributionPayload(milestonesRef.current)
      );
      persistAttribution(milestonesRef.current);
    },
    [buildAttributionPayload, fireEngagement, persistAttribution]
  );

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey,
      searchParams,
      abVariant,
      persona: plannerType || undefined,
      orderingMethod: handoffQuality || undefined,
      leadScore,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [pageKey]);

  useEffect(() => {
    if (!VENUE_LEAK_PAGE_KEYS.has(pageKey)) return;
    persistAttribution();
  }, [pageKey, plannerType, handoffQuality, leadScore, persistAttribution]);

  useEffect(() => {
    if (resultsShown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [resultsShown]);

  const handleCalculate = (ev) => {
    ev.preventDefault();
    setQualificationError('');

    if (!plannerType) {
      setQualificationError('Please select what best describes you.');
      return;
    }
    if (!handoffQuality) {
      setQualificationError('Please select how you currently manage guest preferences.');
      return;
    }

    const events = parseFloat(eventsPerYear);
    const fee = parseFloat(avgEventFee);
    if (!Number.isFinite(events) || events <= 0 || !Number.isFinite(fee) || fee <= 0) {
      return;
    }

    const metrics = computeGuestExperienceGapMetrics({
      plannerType,
      handoffQuality,
      eventsPerYear,
      avgEventFee,
    });

    setSnapshot(metrics);
    setResultsShown(true);
    recordMilestone('calculator_completed');
  };

  const validateCurrentStep = () => {
    setQualificationError('');

    if (currentStepField === 'plannerType' && !plannerType) {
      setQualificationError('Please select what best describes you.');
      return false;
    }
    if (currentStepField === 'handoffQuality' && !handoffQuality) {
      setQualificationError('Please select how you currently manage guest preferences.');
      return false;
    }
    if (currentStepField === 'eventsPerYear') {
      const events = parseFloat(eventsPerYear);
      if (!Number.isFinite(events) || events <= 0) {
        return false;
      }
    }
    if (currentStepField === 'avgEventFee') {
      const fee = parseFloat(avgEventFee);
      if (!Number.isFinite(fee) || fee <= 0) {
        return false;
      }
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

  const handleReportSubmit = useCallback(
    async ({ firstName, email, phone, venueName }) => {
      const contactFields = {
        name: firstName,
        email: email.trim().toLowerCase(),
        phone: phone || null,
        venue_name: venueName,
      };
      const eventPayload = { ...buildAttributionPayload(), ...contactFields };
      fireEngagement('cta_clicked', 'interact', eventPayload);

      const events = parseFloat(eventsPerYear) || 0;
      const fee = parseFloat(avgEventFee) || 0;
      const finalScore = computeEventLeadScore({
        plannerType,
        handoffQuality,
        milestones: milestonesRef.current,
      });

      const contactPayload = {
        fullName: firstName,
        email,
        phone: phone || null,
      };

      const metrics =
        snapshot ||
        computeGuestExperienceGapMetrics({
          plannerType,
          handoffQuality,
          eventsPerYear: events,
          avgEventFee: fee,
        });

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: contactPayload,
          totalFans: events,
          averageOrderValue: fee,
          percentNeverOrdered: Math.round((metrics.dropRate || 0) * 100),
          abVariant,
          persona: plannerType,
          orderingMethod: handoffQuality,
          leadScore: finalScore,
        }),
        sendEventsHeyyouPdf({
          name: firstName,
          email,
          venueName,
          leftOnTable: metrics.total_gap,
        }),
      ];

      captureTasks.push(
        submitUnifiedLead({
          email,
          name: firstName,
          phone: phone || null,
          source: pageKey,
          campaign: leadCampaign,
          visitId: calculatorVisitIdRef.current,
          visitContact: {
            name: `${firstName} — ${venueName}`,
            email,
            phone,
            lastClickCampaign: leadCampaign,
            abVariant,
            persona: plannerType,
            orderingMethod: handoffQuality,
            leadScore: finalScore,
          },
          calculatorEmailFields: buildEventEmailFields(metrics),
        })
      );

      const results = await Promise.all(captureTasks);
      const pdfResult = results[1];
      const leadResult = results[2];

      if (pdfResult?.ok === false) {
        // eslint-disable-next-line no-console
        console.warn('[events calculator] PDF email failed:', pdfResult.error);
        if (typeof window !== 'undefined') {
          window.open('/downloads/heyyou-9-things-events.pdf', '_blank', 'noopener,noreferrer');
        }
      }

      if (!leadResult?.ok) {
        return { ok: false };
      }

      recordMilestone('lead_submitted');
      if (phone) {
        fireEngagement('phone_provided', 'phone_provided', eventPayload);
        recordMilestone('consultation_booked');
      }

      return { ok: true };
    },
    [
      eventsPerYear,
      avgEventFee,
      fireEngagement,
      leadCampaign,
      abVariant,
      plannerType,
      handoffQuality,
      pageKey,
      buildAttributionPayload,
      recordMilestone,
      snapshot,
    ]
  );

  const handleConsultationCta = useCallback(() => {
    recordMilestone('consultation_cta_clicked');
  }, [recordMilestone]);

  const resultCards = useMemo(
    () => (snapshot ? computeGuestExperienceGapMomentAmounts(snapshot) : []),
    [snapshot]
  );

  const totalBannerSubline = snapshot
    ? `Across your ${Math.round(snapshot.eventsPerYear).toLocaleString('en-US')} events, this is the estimated annual revenue impact of guest intelligence gaps between your brief and the venue floor.`
    : undefined;

  const heroResultCards = useMemo(
    () => pickHeroResultCards(resultCards, VISIBLE_LEAK_MOMENT_ID, 3),
    [resultCards]
  );

  return (
    <CalculatorHeroShell>
      {!resultsShown ? (
        <form ref={formRef} className="watch-vs-order-calc-body" onSubmit={handleCalculate}>
          <CalculatorHeroCardIntro
            eyebrow={VARIANT_PRE_HEADLINE}
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
          />

          <CalculatorStepChrome currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                    {currentStepField === 'plannerType' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-planner-type`}>
                          What best describes you?
                        </label>
                        <CalculatorSingleSelectButtons
                          name="plannerType"
                          options={PLANNER_TYPE_OPTIONS}
                          value={plannerType}
                          onChange={setPlannerType}
                          onSelect={() => recordMilestone('calculator_started')}
                          autoAdvance
                          onAdvance={advanceAfterSelect}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'handoffQuality' ? (
                      <div className="watch-vs-order-field-group">
                        <label
                          className="watch-vs-order-field-label"
                          htmlFor={`${idPrefix}-handoff-quality`}
                        >
                          How do you currently manage guest preferences?
                        </label>
                        <CalculatorSingleSelectButtons
                          name="handoffQuality"
                          options={HANDOFF_QUALITY_OPTIONS}
                          value={handoffQuality}
                          onChange={setHandoffQuality}
                          onSelect={() => recordMilestone('calculator_started')}
                          autoAdvance
                          onAdvance={advanceAfterSelect}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'eventsPerYear' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-events-per-year`}>
                          Number of events per year
                        </label>
                        <CalculatorSingleSelectButtons
                          name="eventsPerYear"
                          options={EVENT_BUCKETS.volume}
                          value={eventsPerYear}
                          onChange={setEventsPerYear}
                          onSelect={() => recordMilestone('calculator_started')}
                          autoAdvance
                          onAdvance={advanceAfterSelect}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'avgEventFee' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-avg-event-fee`}>
                          Average event fee ($)
                        </label>
                        <CalculatorSingleSelectButtons
                          name="avgEventFee"
                          options={EVENT_BUCKETS.spend}
                          value={avgEventFee}
                          onChange={setAvgEventFee}
                          onSelect={() => recordMilestone('calculator_started')}
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
        <CalculatorLeakResults
          heroCard
          metrics={snapshot}
          resultCards={heroResultCards}
          visibleCardId={VISIBLE_LEAK_MOMENT_ID}
          visibleMomentLoss={snapshot.moment3}
          formatMoney={formatMoney}
          onReportSubmit={handleReportSubmit}
          onConsultationCta={handleConsultationCta}
          calculatorType="events"
          heroEyebrow="Guest experience gap"
          heroSubhead="That's just one of four gaps. The rest are still open."
          gateChecks={[
            'Full breakdown of all 4 gaps',
            '1 actionable fix you can put in place before your next event',
          ]}
          organizationFieldPlaceholder="Company Name"
          organizationFieldError="Please enter your company name."
          totalBannerSubline={totalBannerSubline}
          gridAriaLabel="Guest experience gap summary"
        />
      ) : null}
    </CalculatorHeroShell>
  );
};

export default EventLeakCalculator;
