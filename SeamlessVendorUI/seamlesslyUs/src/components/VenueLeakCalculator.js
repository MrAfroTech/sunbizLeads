import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/CalculatorGlassCard.css';
import CalculatorLeakResults from './CalculatorLeakResults';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import CalculatorIntroScreen from './CalculatorIntroScreen';
import {
  resolveAbVariant,
  syncAbVariantInSearchParams,
} from '../lib/calculatorAbTest';
import {
  computeLeadScore,
  HERO_ORDERING_OPTIONS,
  HERO_VENUE_TYPE_OPTIONS,
} from '../lib/calculatorLeadScore';
import {
  recordCalculatorPageVisit,
  updateCalculatorPageVisitAttribution,
} from '../lib/calculatorPageVisits';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import { computeWaitCalculatorMetrics } from '../lib/waitCalculatorMath';
import { computeWaitHeroLeakMoments } from '../lib/leakReportMoments';
import { buildWaitCalculatorEmailFields } from '../lib/calculatorEmailPersonalization';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { resolveKnownLeadIdentity } from '../lib/leadIdentity';
import {
  hasCalculatorInputsInUrl,
  parseCalculatorInputsFromSearchParams,
} from '../lib/journeyContactHelpers';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  CalculatorSingleSelectButtons,
} from './CalculatorStepFlow';
import { CALCULATOR_BUCKETS } from '../lib/calculatorBucketOptions';

const RESTAURANT_BUCKETS = CALCULATOR_BUCKETS.restaurants;

const DEFAULT_STATS = [
  {
    value: '77%',
    label: 'of guests say they would spend more if ordering was faster',
  },
  {
    value: '81%',
    label: 'of diners say speed of service is a key factor in where they choose to eat',
  },
  {
    value: '20–30%',
    label:
      'increase in order volume per guest when digital ordering or frictionless ordering systems are used',
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

const VenueLeakCalculator = ({
  pageKey,
  leadCampaign,
  idPrefix = 'venue-leak',
  statCards = DEFAULT_STATS,
  children,
  onBeforeCalculate,
  onAfterCalculate,
  getJourneyParams,
  presentationMode = false,
  onPresentationResultsShown,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const calculatorVisitIdRef = useRef(null);
  const urlResultsAppliedRef = useRef(false);
  const milestonesRef = useRef(new Set());
  const formRef = useRef(null);
  const [milestoneVersion, setMilestoneVersion] = useState(0);
  const { fire: fireEngagement } = useLeadEventTracker(pageKey);

  const abVariant = useMemo(() => resolveAbVariant(searchParams), [searchParams]);

  const [venueType, setVenueType] = useState(presentationMode ? 'Restaurant' : '');
  const [orderingMethod, setOrderingMethod] = useState(presentationMode ? 'QR ordering' : '');
  const [qualificationError, setQualificationError] = useState('');
  const [peakNightCustomers, setPeakNightCustomers] = useState('');
  const [averageSpendPerCustomer, setAverageSpendPerCustomer] = useState('');
  const [resultsShown, setResultsShown] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [introComplete, setIntroComplete] = useState(presentationMode);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = presentationMode ? 2 : 4;

  const currentStepField = presentationMode
    ? ['peak', 'spend'][currentStep]
    : ['venueType', 'ordering', 'peak', 'spend'][currentStep];

  const venueTypeOptions = HERO_VENUE_TYPE_OPTIONS;
  const orderingOptions = HERO_ORDERING_OPTIONS;

  const leadScore = useMemo(
    () =>
      computeLeadScore({
        persona: venueType || undefined,
        orderingMethod: orderingMethod || undefined,
        milestones: milestonesRef.current,
      }),
    [venueType, orderingMethod, milestoneVersion]
  );

  const knownIdentity = useMemo(
    () => resolveKnownLeadIdentity(searchParams),
    [searchParams]
  );

  const attributionPayload = useMemo(
    () => ({
      ...knownIdentity,
      ab_variant: abVariant,
      persona: venueType || knownIdentity.persona || null,
      ordering_method: orderingMethod || knownIdentity.ordering_method || null,
      lead_score: leadScore,
      peak_night_customers:
        peakNightCustomers || knownIdentity.peak_night_customers || null,
      average_spend_per_customer:
        averageSpendPerCustomer || knownIdentity.average_spend_per_customer || null,
    }),
    [
      abVariant,
      venueType,
      orderingMethod,
      leadScore,
      peakNightCustomers,
      averageSpendPerCustomer,
      knownIdentity,
    ]
  );

  useEffect(() => {
    const inputs = parseCalculatorInputsFromSearchParams(searchParams);
    if (inputs.persona) setVenueType(inputs.persona);
    if (inputs.orderingMethod) setOrderingMethod(inputs.orderingMethod);
    if (inputs.peakNightCustomers) setPeakNightCustomers(inputs.peakNightCustomers);
    if (inputs.averageSpendPerCustomer) {
      setAverageSpendPerCustomer(inputs.averageSpendPerCustomer);
    }

    if (urlResultsAppliedRef.current || !hasCalculatorInputsInUrl(searchParams)) return;

    urlResultsAppliedRef.current = true;
    setIntroComplete(true);
    const metrics = computeWaitCalculatorMetrics({
      peakNightCustomers: inputs.peakNightCustomers,
      averageSpendPerCustomer: inputs.averageSpendPerCustomer,
    });
    setSnapshot(metrics);
    setResultsShown(true);
  }, [searchParams]);

  useEffect(() => {
    syncAbVariantInSearchParams(searchParams, setSearchParams, abVariant);
  }, [abVariant, searchParams, setSearchParams]);

  useEffect(() => {
    if (presentationMode && resultsShown) {
      onPresentationResultsShown?.();
    }
  }, [presentationMode, resultsShown, onPresentationResultsShown]);

  const persistAttribution = useCallback(
    (nextMilestones) => {
      const visitId = calculatorVisitIdRef.current;
      if (!visitId) return;

      const score = computeLeadScore({
        persona: venueType || undefined,
        orderingMethod: orderingMethod || undefined,
        milestones: nextMilestones ?? milestonesRef.current,
      });

      void updateCalculatorPageVisitAttribution({
        id: visitId,
        name: knownIdentity.name || undefined,
        email: knownIdentity.email || undefined,
        phone: knownIdentity.phone || undefined,
        abVariant,
        persona: venueType || undefined,
        orderingMethod: orderingMethod || undefined,
        leadScore: score,
      });
    },
    [abVariant, venueType, orderingMethod, knownIdentity]
  );

  const buildAttributionPayload = useCallback(
    (milestones = milestonesRef.current) => ({
      visit_id: calculatorVisitIdRef.current || undefined,
      ...knownIdentity,
      ab_variant: abVariant,
      persona: venueType || null,
      ordering_method: orderingMethod || null,
      lead_score: computeLeadScore({
        persona: venueType || undefined,
        orderingMethod: orderingMethod || undefined,
        milestones,
      }),
    }),
    [abVariant, venueType, orderingMethod, knownIdentity]
  );

  const engagementTypeForMilestone = (eventType) => {
    if (eventType === 'lead_submitted') return 'submit';
    if (eventType === 'phone_provided' || eventType === 'consultation_booked') return 'phone_provided';
    return 'interact';
  };

  const recordMilestone = useCallback(
    (eventType, extraMeta = {}) => {
      if (milestonesRef.current.has(eventType)) return;
      milestonesRef.current.add(eventType);
      setMilestoneVersion((version) => version + 1);
      fireEngagement(
        eventType,
        engagementTypeForMilestone(eventType),
        { ...buildAttributionPayload(milestonesRef.current), ...extraMeta }
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
      persona: venueType || undefined,
      orderingMethod: orderingMethod || undefined,
      leadScore,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [pageKey]);

  useEffect(() => {
    if (!VENUE_LEAK_PAGE_KEYS.has(pageKey)) return;
    persistAttribution();
  }, [pageKey, venueType, orderingMethod, leadScore, persistAttribution]);

  useEffect(() => {
    if (resultsShown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [resultsShown]);

  const handleCalculate = (ev) => {
    ev.preventDefault();
    setQualificationError('');

    if (!presentationMode) {
      if (!venueType) {
        setQualificationError('Please select what type of venue you operate.');
        return;
      }
      if (!orderingMethod) {
        setQualificationError('Please select how guests currently order.');
        return;
      }
    }

    if (onBeforeCalculate && onBeforeCalculate() === false) {
      return;
    }

    const customers = parseFloat(peakNightCustomers);
    const spend = parseFloat(averageSpendPerCustomer);
    if (!Number.isFinite(customers) || customers <= 0 || !Number.isFinite(spend) || spend <= 0) {
      return;
    }

    const metrics = computeWaitCalculatorMetrics({
      peakNightCustomers,
      averageSpendPerCustomer,
    });

    setSnapshot(metrics);
    setResultsShown(true);
    recordMilestone('calculator_completed', buildWaitCalculatorEmailFields(metrics));
    if (presentationMode) {
      onPresentationResultsShown?.();
    }
    onAfterCalculate?.({ peakNightCustomers: customers, averageSpendPerCustomer: spend, metrics });
  };

  const isCurrentStepComplete = useMemo(() => {
    if (currentStepField === 'venueType') return Boolean(venueType);
    if (currentStepField === 'ordering') return Boolean(orderingMethod);
    if (currentStepField === 'peak') {
      const customers = parseFloat(peakNightCustomers);
      return Number.isFinite(customers) && customers > 0;
    }
    if (currentStepField === 'spend') {
      const spend = parseFloat(averageSpendPerCustomer);
      return Number.isFinite(spend) && spend > 0;
    }
    return false;
  }, [currentStepField, venueType, orderingMethod, peakNightCustomers, averageSpendPerCustomer]);

  const validateCurrentStep = () => {
    setQualificationError('');

    if (currentStepField === 'venueType' && !venueType) {
      setQualificationError('Please select what type of venue you operate.');
      return false;
    }
    if (currentStepField === 'ordering' && !orderingMethod) {
      setQualificationError('Please select how guests currently order.');
      return false;
    }
    if (currentStepField === 'peak') {
      const customers = parseFloat(peakNightCustomers);
      if (!Number.isFinite(customers) || customers <= 0) {
        return false;
      }
    }
    if (currentStepField === 'spend') {
      const spend = parseFloat(averageSpendPerCustomer);
      if (!Number.isFinite(spend) || spend <= 0) {
        return false;
      }
    }
    return true;
  };

  const handleStepNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
  };

  const handleStepBack = () => {
    setQualificationError('');
    if (!presentationMode && currentStep === 0) {
      setIntroComplete(false);
      return;
    }
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleIntroStart = () => {
    recordMilestone('calculator_started');
    setIntroComplete(true);
    setCurrentStep(0);
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

      const customers = parseFloat(peakNightCustomers) || 0;
      const spend = parseFloat(averageSpendPerCustomer) || 0;
      const finalScore = computeLeadScore({
        persona: venueType,
        orderingMethod,
        milestones: milestonesRef.current,
      });

      const contactPayload = {
        fullName: firstName,
        email,
        phone: phone || null,
      };

      const journeyParams = getJourneyParams
        ? getJourneyParams({ peakNightCustomers: customers, averageSpendPerCustomer: spend })
        : {
            totalFans: customers,
            averageOrderValue: spend,
            percentNeverOrdered: 45,
          };

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: contactPayload,
          ...journeyParams,
          abVariant,
          persona: venueType,
          orderingMethod,
          leadScore: finalScore,
        }),
      ];

      const metrics =
        snapshot ||
        computeWaitCalculatorMetrics({
          peakNightCustomers: customers,
          averageSpendPerCustomer: spend,
        });

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
            persona: venueType,
            orderingMethod,
            leadScore: finalScore,
          },
          calculatorEmailFields: buildWaitCalculatorEmailFields(metrics),
        })
      );

      const results = await Promise.all(captureTasks);
      const leadResult = results[results.length - 1];
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
      peakNightCustomers,
      averageSpendPerCustomer,
      fireEngagement,
      getJourneyParams,
      leadCampaign,
      abVariant,
      venueType,
      orderingMethod,
      pageKey,
      buildAttributionPayload,
      recordMilestone,
      snapshot,
    ]
  );

  const handleConsultationCta = useCallback(() => {
    recordMilestone('consultation_cta_clicked');
  }, [recordMilestone]);

  const calculatorForm = (
    <form ref={formRef} className="watch-vs-order-calc-body" onSubmit={handleCalculate}>
      {!presentationMode ? (
        <CalculatorHeroCardIntro
          currentStep={currentStep}
          totalSteps={totalSteps}
          showDuration
        />
      ) : (
        <CalculatorHeroSubhead />
      )}
      <CalculatorStepChrome currentStep={currentStep} totalSteps={totalSteps} />

      {currentStepField === 'venueType' ? (
        <div className="watch-vs-order-field-group">
          <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-venue-type`}>
            What type of venue do you operate?
          </label>
          <CalculatorSingleSelectButtons
            name="venueType"
            options={venueTypeOptions}
            value={venueType}
            onChange={setVenueType}
            onSelect={() => recordMilestone('calculator_started')}
          />
        </div>
      ) : null}

      {currentStepField === 'ordering' ? (
        <div className="watch-vs-order-field-group">
          <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-ordering`}>
            How do guests currently order?
          </label>
          <CalculatorSingleSelectButtons
            name="orderingMethod"
            options={orderingOptions}
            value={orderingMethod}
            onChange={setOrderingMethod}
            onSelect={() => recordMilestone('calculator_started')}
          />
        </div>
      ) : null}

      {currentStepField === 'peak' ? (
        <div className="watch-vs-order-field-group">
          <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-peak-customers`}>
            Number of customers on peak nights
          </label>
          <CalculatorSingleSelectButtons
            name="peakNightCustomers"
            options={RESTAURANT_BUCKETS.volume}
            value={peakNightCustomers}
            onChange={setPeakNightCustomers}
            onSelect={() => recordMilestone('calculator_started')}
          />
        </div>
      ) : null}

      {currentStepField === 'spend' ? (
        <div className="watch-vs-order-field-group">
          <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-avg-spend`}>
            Average spend per customer
          </label>
          <CalculatorSingleSelectButtons
            name="averageSpendPerCustomer"
            options={RESTAURANT_BUCKETS.spend}
            value={averageSpendPerCustomer}
            onChange={setAverageSpendPerCustomer}
            onSelect={() => recordMilestone('calculator_started')}
          />
        </div>
      ) : null}

      {children}

      {qualificationError ? (
        <p className="watch-vs-order-field-label" role="alert">
          {qualificationError}
        </p>
      ) : null}

      <CalculatorStepNav
        showBack={currentStep > 0 || (!presentationMode && introComplete)}
        onBack={handleStepBack}
        onNext={handleStepNext}
        isLastStep={currentStep === totalSteps - 1}
        submitLabel="Show Me What I'm Leaving on the Table"
        nextDisabled={!isCurrentStepComplete}
      />
    </form>
  );

  const calculatorResults = resultsShown && snapshot ? (
    <CalculatorLeakResults
      metrics={snapshot}
      visibleMomentLoss={snapshot.missedRevenueThatNight}
      formatMoney={formatMoney}
      onReportSubmit={handleReportSubmit}
      onConsultationCta={handleConsultationCta}
      calculatorType="wait"
      presentationMode={presentationMode}
      heroCard
      heroEyebrow="Peak night revenue leak"
      resultCards={computeWaitHeroLeakMoments(snapshot)}
      gateChecks={[
        'Full breakdown of all 4 friction points',
        '1 actionable fix you can implement tonight',
      ]}
    />
  ) : null;

  return (
    <CalculatorHeroShell
      className={presentationMode ? 'watch-vs-order-page--presentation' : ''}
      introActive={!resultsShown && !introComplete}
      glassCard
    >
      {!resultsShown && !introComplete ? (
        <CalculatorIntroScreen onStart={handleIntroStart} />
      ) : null}
      {!resultsShown && introComplete ? calculatorForm : null}
      {resultsShown ? calculatorResults : null}
    </CalculatorHeroShell>
  );
};

export default VenueLeakCalculator;
