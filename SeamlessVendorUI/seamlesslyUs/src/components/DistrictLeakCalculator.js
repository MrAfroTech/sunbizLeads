import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/CalculatorGlassCard.css';
import '../styles/CalculatorRangeField.css';
import CalculatorLeakResults from './CalculatorLeakResults';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import DownloadReveal from './DownloadReveal';
import {
  resolveAbVariant,
  syncAbVariantInSearchParams,
} from '../lib/calculatorAbTest';
import {
  computeDistrictLeadScore,
  DISTRICT_TYPE_OPTIONS,
  EVENT_FREQUENCY_OPTIONS,
  HERO_DISTRICT_TYPE_OPTIONS,
} from '../lib/districtCalculatorLeadScore';
import { computeDistrictCalculatorMetrics } from '../lib/districtCalculatorMath';
import {
  recordCalculatorPageVisit,
  updateCalculatorPageVisitAttribution,
} from '../lib/calculatorPageVisits';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { buildDistrictEmailFields } from '../lib/calculatorEmailPersonalization';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { useCalculatorEngagementTracker } from '../lib/useCalculatorEngagementTracker';
import { resolveKnownLeadIdentity } from '../lib/leadIdentity';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  CalculatorSingleSelectButtons,
  useCalculatorAutoAdvance,
} from './CalculatorStepFlow';
import CalculatorRangeField from './CalculatorRangeField';
import { CALCULATOR_RANGE_FIELDS } from '../lib/calculatorRangeConfig';

const DISTRICT_PRE_HEADLINE =
  'Every district has corridor revenue left on the table.';

const DISTRICT_VARIANT_COPY = {
  a: {
    headline: 'How much is your corridor leaving behind?',
    subhead: 'Model the whole district — not one venue. ↓',
    cta: 'Calculate Corridor Revenue Lift',
  },
  b: {
    headline: 'See what your member businesses could capture together this year.',
    subhead: null,
    cta: 'Calculate Corridor Revenue Lift',
  },
};

const DISTRICT_STAT_CARDS = [
  {
    value: '23%',
    label: 'gross sales lift documented when mobile ordering is available',
  },
  {
    value: '104',
    label: 'weekend days modeled across the year (Fri + Sat)',
  },
  {
    value: '60%',
    label: 'of the ceiling shown — conservative by design',
  },
];

const CALCULATOR_ENGAGEMENT_NAME = 'district';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const TOTAL_STEPS = 4;
const STEP_FIELDS = ['districtType', 'eventFrequency', 'memberBusinesses', 'friSatFootTraffic'];

const DistrictLeakCalculator = ({
  pageKey,
  leadCampaign,
  idPrefix = 'district-calc',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const calculatorVisitIdRef = useRef(null);
  const milestonesRef = useRef(new Set());
  const formRef = useRef(null);
  const [milestoneVersion, setMilestoneVersion] = useState(0);
  const { fire: fireLeadEvent } = useLeadEventTracker(pageKey);
  const { fire: fireEngagement, setAttribution } = useCalculatorEngagementTracker(
    CALCULATOR_ENGAGEMENT_NAME
  );

  const abVariant = useMemo(() => resolveAbVariant(searchParams), [searchParams]);
  const copy = DISTRICT_VARIANT_COPY[abVariant] ?? DISTRICT_VARIANT_COPY.a;

  const [districtType, setDistrictType] = useState('');
  const [eventFrequency, setEventFrequency] = useState('');
  const [qualificationError, setQualificationError] = useState('');
  const [memberBusinesses, setMemberBusinesses] = useState('');
  const [friSatFootTraffic, setFriSatFootTraffic] = useState('');
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
      computeDistrictLeadScore({
        districtType: districtType || undefined,
        eventFrequency: eventFrequency || undefined,
        milestones: milestonesRef.current,
      }),
    [districtType, eventFrequency, milestoneVersion]
  );

  const knownIdentity = useMemo(
    () => resolveKnownLeadIdentity(searchParams),
    [searchParams]
  );

  useEffect(() => {
    syncAbVariantInSearchParams(searchParams, setSearchParams, abVariant);
  }, [abVariant, searchParams, setSearchParams]);

  const buildEngagementContext = useCallback(
    (milestones = milestonesRef.current) => ({
      ab_variant: abVariant,
      persona: districtType || null,
      ordering_method: eventFrequency || null,
      peak_night_customers: memberBusinesses || null,
      average_spend_per_customer: friSatFootTraffic || null,
      lead_score: computeDistrictLeadScore({
        districtType: districtType || undefined,
        eventFrequency: eventFrequency || undefined,
        milestones,
      }),
      ...knownIdentity,
    }),
    [abVariant, districtType, eventFrequency, memberBusinesses, friSatFootTraffic, knownIdentity]
  );

  useEffect(() => {
    setAttribution(buildEngagementContext());
  }, [buildEngagementContext, setAttribution]);

  const persistAttribution = useCallback(
    (nextMilestones) => {
      const visitId = calculatorVisitIdRef.current;
      if (!visitId) return;

      const score = computeDistrictLeadScore({
        districtType: districtType || undefined,
        eventFrequency: eventFrequency || undefined,
        milestones: nextMilestones ?? milestonesRef.current,
      });

      void updateCalculatorPageVisitAttribution({
        id: visitId,
        name: knownIdentity.name || undefined,
        email: knownIdentity.email || undefined,
        phone: knownIdentity.phone || undefined,
        abVariant,
        persona: districtType || undefined,
        orderingMethod: eventFrequency || undefined,
        leadScore: score,
      });
    },
    [abVariant, districtType, eventFrequency, knownIdentity]
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

      const context = buildEngagementContext(milestonesRef.current);
      fireEngagement(eventType, context);
      fireLeadEvent(eventType, engagementTypeForMilestone(eventType), context);
      persistAttribution(milestonesRef.current);
    },
    [buildEngagementContext, fireEngagement, fireLeadEvent, persistAttribution]
  );

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey,
      searchParams,
      abVariant,
      persona: districtType || undefined,
      orderingMethod: eventFrequency || undefined,
      leadScore,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [pageKey]);

  useEffect(() => {
    persistAttribution();
  }, [districtType, eventFrequency, leadScore, persistAttribution]);

  useEffect(() => {
    if (resultsShown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [resultsShown]);

  const handleCalculate = (ev) => {
    ev.preventDefault();
    setQualificationError('');

    if (!districtType) {
      setQualificationError('Please select your district type.');
      return;
    }
    if (!eventFrequency) {
      setQualificationError('Please select your peak event frequency.');
      return;
    }

    const businesses = parseFloat(memberBusinesses);
    const footTraffic = parseFloat(friSatFootTraffic);
    if (!Number.isFinite(businesses) || businesses <= 0 || !Number.isFinite(footTraffic) || footTraffic <= 0) {
      return;
    }

    const metrics = computeDistrictCalculatorMetrics({
      districtType,
      eventFrequency,
      memberBusinesses,
      friSatFootTraffic,
    });

    setSnapshot(metrics);
    setResultsShown(true);
    recordMilestone('calculator_completed');
  };

  const validateCurrentStep = () => {
    setQualificationError('');

    if (currentStepField === 'districtType' && !districtType) {
      setQualificationError('Please select your district type.');
      return false;
    }
    if (currentStepField === 'eventFrequency' && !eventFrequency) {
      setQualificationError('Please select your peak event frequency.');
      return false;
    }
    if (currentStepField === 'memberBusinesses') {
      const businesses = parseFloat(memberBusinesses);
      if (!Number.isFinite(businesses) || businesses <= 0) {
        return false;
      }
    }
    if (currentStepField === 'friSatFootTraffic') {
      const footTraffic = parseFloat(friSatFootTraffic);
      if (!Number.isFinite(footTraffic) || footTraffic <= 0) {
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
    async ({ firstName, email, phone, districtName }) => {
      const trimmedPhone = (phone || '').trim();
      if (trimmedPhone.replace(/\D/g, '').length < 7) {
        return { ok: false, error: 'Phone number is required.' };
      }

      const contactFields = {
        name: firstName,
        email: email.trim().toLowerCase(),
        phone: trimmedPhone,
        venue_name: districtName,
      };
      const eventPayload = { ...buildEngagementContext(), ...contactFields };

      fireEngagement('cta_clicked', eventPayload);
      fireLeadEvent('cta_clicked', 'interact', eventPayload);
      recordMilestone('lead_submitted');
      fireEngagement('phone_provided', eventPayload);
      fireLeadEvent('phone_provided', 'phone_provided', eventPayload);
      recordMilestone('consultation_booked');

      const finalScore = computeDistrictLeadScore({
        districtType,
        eventFrequency,
        milestones: milestonesRef.current,
      });

      const leadResult = await submitUnifiedLead({
        email,
        name: firstName,
        phone: trimmedPhone,
        source: pageKey,
        campaign: leadCampaign,
        visitId: calculatorVisitIdRef.current,
        visitContact: {
          name: `${firstName} — ${districtName}`,
          email,
          phone: trimmedPhone,
          lastClickCampaign: leadCampaign,
          abVariant,
          persona: districtType,
          orderingMethod: eventFrequency,
          leadScore: finalScore,
        },
        calculatorEmailFields: buildDistrictEmailFields(snapshot),
      });

      if (!leadResult.ok) {
        return { ok: false, error: 'Unable to save your report. Please try again.' };
      }

      return { ok: true };
    },
    [
      buildEngagementContext,
      districtType,
      eventFrequency,
      fireEngagement,
      fireLeadEvent,
      leadCampaign,
      pageKey,
      recordMilestone,
      snapshot,
    ]
  );

  const handleConsultationCta = useCallback(() => {
    recordMilestone('consultation_cta_clicked');
  }, [recordMilestone]);

  const formattedBusinesses = snapshot
    ? Math.round(snapshot.memberBusinesses).toLocaleString('en-US')
    : '';
  const formattedTraffic = snapshot
    ? Math.round(snapshot.friSatFootTraffic).toLocaleString('en-US')
    : '';

  const districtResultCards = useMemo(() => {
    if (!snapshot) return [];
    const businesses = Math.max(snapshot.memberBusinesses, 1);
    return [
      { id: 'annual', name: 'Corridor-level revenue lift', amount: snapshot.corridorAnnualLift },
      { id: 'weekend', name: 'Corridor lift per weekend', amount: snapshot.corridorLiftPerWeekend },
      {
        id: 'per-business',
        name: 'Annual lift per member business',
        amount: snapshot.corridorAnnualLift / businesses,
      },
      { id: 'monthly', name: 'Average monthly corridor lift', amount: snapshot.corridorAnnualLift / 12 },
    ];
  }, [snapshot]);

  return (
    <CalculatorHeroShell glassCard>
      {!resultsShown ? (
        <form ref={formRef} className="watch-vs-order-calc-body" onSubmit={handleCalculate}>
          <CalculatorHeroCardIntro
            eyebrow={DISTRICT_PRE_HEADLINE}
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
          />

          <CalculatorStepChrome currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                    {currentStepField === 'districtType' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-district-type`}>
                          District type
                        </label>
                        <CalculatorSingleSelectButtons
                          name="districtType"
                          options={HERO_DISTRICT_TYPE_OPTIONS}
                          value={districtType}
                          onChange={setDistrictType}
                          onSelect={() => recordMilestone('calculator_started')}
                          autoAdvance
                          onAdvance={advanceAfterSelect}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'eventFrequency' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-event-frequency`}>
                          Peak event frequency
                        </label>
                        <CalculatorSingleSelectButtons
                          name="eventFrequency"
                          options={EVENT_FREQUENCY_OPTIONS}
                          value={eventFrequency}
                          onChange={setEventFrequency}
                          onSelect={() => recordMilestone('calculator_started')}
                          autoAdvance
                          onAdvance={advanceAfterSelect}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'memberBusinesses' ? (
                      <CalculatorRangeField
                        id={`${idPrefix}-member-businesses`}
                        label="Number of active member businesses"
                        value={memberBusinesses}
                        onChange={(nextValue) => {
                          recordMilestone('calculator_started');
                          setMemberBusinesses(nextValue);
                        }}
                        onFocus={() => recordMilestone('calculator_started')}
                        {...CALCULATOR_RANGE_FIELDS.memberBusinesses}
                      />
                    ) : null}

                    {currentStepField === 'friSatFootTraffic' ? (
                      <CalculatorRangeField
                        id={`${idPrefix}-foot-traffic`}
                        label="Average Friday/Saturday foot traffic"
                        value={friSatFootTraffic}
                        onChange={(nextValue) => {
                          recordMilestone('calculator_started');
                          setFriSatFootTraffic(nextValue);
                        }}
                        onFocus={() => recordMilestone('calculator_started')}
                        {...CALCULATOR_RANGE_FIELDS.footTraffic}
                      />
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
                      submitLabel="Show Me My District's Revenue Gap"
                    />
        </form>
      ) : null}

      {resultsShown && snapshot ? (
        <CalculatorLeakResults
          heroCard
          resultCards={districtResultCards}
          visibleCardId="annual"
          visibleMomentLoss={snapshot.corridorAnnualLift}
          formatMoney={formatMoney}
          onReportSubmit={({ venueName, ...rest }) =>
            handleReportSubmit({ districtName: venueName, ...rest })
          }
          onConsultationCta={handleConsultationCta}
          calculatorType="districts"
          heroEyebrow="District revenue opportunity"
          heroHeadline={
            <>
              YOUR CORRIDOR COULD CAPTURE{' '}
              <span className="leak-results__hero-card-figure">
                {formatMoney(snapshot.corridorAnnualLift)}
              </span>{' '}
              ANNUALLY
            </>
          }
          heroSubhead={`Conservative estimate across ${formattedBusinesses} member businesses and ${formattedTraffic} Friday/Saturday visitors — modeled for ${snapshot.districtType || 'your district'}.`}
          gateChecks={[
            'Full corridor projection breakdown',
            'Deployment playbook for BID and city funding conversations',
          ]}
          organizationFieldPlaceholder="District Name"
          organizationFieldError="Please enter your district name."
          gridAriaLabel="Corridor projection summary"
          postRevealExtras={({ email, name, phone }) => (
            <DownloadReveal email={email} name={name} phone={phone} />
          )}
        />
      ) : null}
    </CalculatorHeroShell>
  );
};

export default DistrictLeakCalculator;
