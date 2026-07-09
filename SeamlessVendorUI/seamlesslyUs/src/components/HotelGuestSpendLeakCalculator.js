import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import CalculatorLeakResults from './CalculatorLeakResults';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import { pickHeroResultCards } from '../lib/heroResultCards';
import {
  resolveAbVariant,
  syncAbVariantInSearchParams,
  VARIANT_COPY,
  VARIANT_PRE_HEADLINE,
} from '../lib/calculatorAbTest';
import {
  computeHotelGuestSpendLeadScore,
  HOTEL_ROLE_OPTIONS,
} from '../lib/hotelGuestSpendCalculatorLeadScore';
import {
  computeHotelGuestSpendMetrics,
  computeHotelResultCards,
  HOTEL_VISIBLE_CARD_ID,
} from '../lib/hotelGuestSpendCalculatorMath';
import {
  recordCalculatorPageVisit,
  updateCalculatorPageVisitAttribution,
} from '../lib/calculatorPageVisits';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import { buildHotelGuestSpendEmailFields } from '../lib/calculatorEmailPersonalization';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { sendHotelsHeyyouPdf } from '../lib/sendHotelsHeyyouPdf';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { resolveKnownLeadIdentity } from '../lib/leadIdentity';
import {
  hasHotelCalculatorInputsInUrl,
  parseHotelCalculatorInputsFromSearchParams,
} from '../lib/journeyContactHelpers';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  CalculatorSingleSelectButtons,
  useCalculatorAutoAdvance,
} from './CalculatorStepFlow';
import { CALCULATOR_BUCKETS } from '../lib/calculatorBucketOptions';

const HOTEL_BUCKETS = CALCULATOR_BUCKETS.hotels;

const HOTEL_STAT_CARDS = [
  {
    value: '28%',
    label: 'of hotel guests use on-site dining (industry average)',
  },
  {
    value: '11%',
    label: 'of guests order room service',
  },
  {
    value: '45%',
    label: 'of missed ancillary revenue recoverable with targeted offers',
  },
];

const VENUE_LEAK_PAGE_KEYS = new Set(['wait_calculator', 'restaurants_calculator', 'hotels_calculator', 'events_calculator']);

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const TOTAL_STEPS = 3;
const STEP_FIELDS = ['role', 'nightlyRate', 'guestsPerNight'];

const HotelGuestSpendLeakCalculator = ({
  pageKey,
  leadCampaign,
  idPrefix = 'hotels-calc',
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

  const [role, setRole] = useState('');
  const [qualificationError, setQualificationError] = useState('');
  const [nightlyRate, setNightlyRate] = useState('');
  const [guestsPerNight, setGuestsPerNight] = useState('');
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
      computeHotelGuestSpendLeadScore({
        role: role || undefined,
        milestones: milestonesRef.current,
      }),
    [role, milestoneVersion]
  );

  const knownIdentity = useMemo(
    () => resolveKnownLeadIdentity(searchParams),
    [searchParams]
  );

  useEffect(() => {
    const inputs = parseHotelCalculatorInputsFromSearchParams(searchParams);
    if (inputs.role) setRole(inputs.role);
    if (inputs.nightlyRate) setNightlyRate(inputs.nightlyRate);
    if (inputs.guestsPerNight) setGuestsPerNight(inputs.guestsPerNight);

    if (urlResultsAppliedRef.current || !hasHotelCalculatorInputsInUrl(searchParams)) return;

    urlResultsAppliedRef.current = true;
    const metrics = computeHotelGuestSpendMetrics({
      role: inputs.role,
      nightlyRate: inputs.nightlyRate,
      guestsPerNight: inputs.guestsPerNight,
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

      const score = computeHotelGuestSpendLeadScore({
        role: role || undefined,
        milestones: nextMilestones ?? milestonesRef.current,
      });

      void updateCalculatorPageVisitAttribution({
        id: visitId,
        name: knownIdentity.name || undefined,
        email: knownIdentity.email || undefined,
        phone: knownIdentity.phone || undefined,
        abVariant,
        persona: role || undefined,
        leadScore: score,
      });
    },
    [abVariant, role, knownIdentity]
  );

  const buildAttributionPayload = useCallback(
    (milestones = milestonesRef.current) => ({
      visit_id: calculatorVisitIdRef.current || undefined,
      ...knownIdentity,
      ab_variant: abVariant,
      persona: role || null,
      lead_score: computeHotelGuestSpendLeadScore({
        role: role || undefined,
        milestones,
      }),
    }),
    [abVariant, role, knownIdentity]
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
      persona: role || undefined,
      leadScore,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [pageKey]);

  useEffect(() => {
    if (!VENUE_LEAK_PAGE_KEYS.has(pageKey)) return;
    persistAttribution();
  }, [pageKey, role, leadScore, persistAttribution]);

  useEffect(() => {
    if (resultsShown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [resultsShown]);

  const handleCalculate = (ev) => {
    ev.preventDefault();
    setQualificationError('');

    if (!role) {
      setQualificationError('Please select what best describes you.');
      return;
    }

    const rate = parseFloat(nightlyRate);
    const guests = parseFloat(guestsPerNight);
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(guests) || guests <= 0) {
      return;
    }

    const metrics = computeHotelGuestSpendMetrics({
      role,
      nightlyRate,
      guestsPerNight,
    });

    setSnapshot(metrics);
    setResultsShown(true);
    recordMilestone('calculator_completed');
  };

  const validateCurrentStep = () => {
    setQualificationError('');

    if (currentStepField === 'role' && !role) {
      setQualificationError('Please select what best describes you.');
      return false;
    }
    if (currentStepField === 'nightlyRate') {
      const rate = parseFloat(nightlyRate);
      if (!Number.isFinite(rate) || rate <= 0) {
        return false;
      }
    }
    if (currentStepField === 'guestsPerNight') {
      const guests = parseFloat(guestsPerNight);
      if (!Number.isFinite(guests) || guests <= 0) {
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

      const rate = parseFloat(nightlyRate) || 0;
      const guests = parseFloat(guestsPerNight) || 0;
      const finalScore = computeHotelGuestSpendLeadScore({
        role,
        milestones: milestonesRef.current,
      });

      const contactPayload = {
        fullName: firstName,
        email,
        phone: phone || null,
      };

      const metrics =
        snapshot ||
        computeHotelGuestSpendMetrics({
          role,
          nightlyRate: rate,
          guestsPerNight: guests,
        });

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: contactPayload,
          totalFans: guests,
          averageOrderValue: rate,
          percentNeverOrdered: 72,
          abVariant,
          persona: role,
          leadScore: finalScore,
        }),
        sendHotelsHeyyouPdf({
          name: firstName,
          email,
          venueName,
          leftOnTable: metrics.monthlyMissedRevenue,
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
            persona: role,
            leadScore: finalScore,
          },
          calculatorEmailFields: buildHotelGuestSpendEmailFields(metrics),
        })
      );

      const results = await Promise.all(captureTasks);
      const pdfResult = results[1];
      const leadResult = results[2];

      if (pdfResult?.ok === false) {
        // eslint-disable-next-line no-console
        console.warn('[hotels calculator] PDF email failed:', pdfResult.error);
        if (typeof window !== 'undefined') {
          window.open('/downloads/heyyou-9-things-hotels.pdf', '_blank', 'noopener,noreferrer');
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
      nightlyRate,
      guestsPerNight,
      fireEngagement,
      leadCampaign,
      abVariant,
      role,
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
    () => (snapshot ? computeHotelResultCards(snapshot) : []),
    [snapshot]
  );

  const hotelHeroSubhead = snapshot
    ? `${Math.round(snapshot.guestsPerNight).toLocaleString('en-US')} guests per night at ${formatMoney(snapshot.nightlyRate)} average rate${snapshot.role ? ` — ${snapshot.role}` : ''}. You're missing ${formatMoney(snapshot.monthlyMissedRevenue)} in ancillary revenue every month.`
    : "That's just one night on property. The rest of the breakdown is still hidden.";

  const heroResultCards = useMemo(
    () => pickHeroResultCards(resultCards, HOTEL_VISIBLE_CARD_ID, 3),
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

                    {currentStepField === 'role' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-role`}>
                          What best describes you?
                        </label>
                        <CalculatorSingleSelectButtons
                          name="role"
                          options={HOTEL_ROLE_OPTIONS}
                          value={role}
                          onChange={setRole}
                          onSelect={() => recordMilestone('calculator_started')}
                          autoAdvance
                          onAdvance={advanceAfterSelect}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'nightlyRate' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor={`${idPrefix}-nightly-rate`}>
                          Average nightly rate ($)
                        </label>
                        <CalculatorSingleSelectButtons
                          name="nightlyRate"
                          options={HOTEL_BUCKETS.spend}
                          value={nightlyRate}
                          onChange={setNightlyRate}
                          onSelect={() => recordMilestone('calculator_started')}
                          autoAdvance
                          onAdvance={advanceAfterSelect}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'guestsPerNight' ? (
                      <div className="watch-vs-order-field-group">
                        <label
                          className="watch-vs-order-field-label"
                          htmlFor={`${idPrefix}-guests-per-night`}
                        >
                          Number of guests on property per night
                        </label>
                        <CalculatorSingleSelectButtons
                          name="guestsPerNight"
                          options={HOTEL_BUCKETS.volume}
                          value={guestsPerNight}
                          onChange={setGuestsPerNight}
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
          visibleCardId={HOTEL_VISIBLE_CARD_ID}
          visibleMomentLoss={snapshot.baseRoomRevenue}
          formatMoney={formatMoney}
          onReportSubmit={handleReportSubmit}
          onConsultationCta={handleConsultationCta}
          calculatorType="hotels"
          heroEyebrow="On-property guest spend"
          heroHeadline={
            <>
              Your guests are on property. They&apos;re just not spending — yet.{' '}
              <span className="leak-results__hero-card-figure">
                {formatMoney(snapshot.baseRoomRevenue)}
              </span>
            </>
          }
          heroSubhead={hotelHeroSubhead}
          gridAriaLabel="Guest spend projection summary"
        />
      ) : null}
    </CalculatorHeroShell>
  );
};

export default HotelGuestSpendLeakCalculator;
