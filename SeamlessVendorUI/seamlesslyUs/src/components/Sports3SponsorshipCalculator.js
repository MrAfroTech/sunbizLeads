import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/CalculatorGlassCard.css';
import SportsGatedCalculatorResults from './SportsGatedCalculatorResults';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import {
  CALCULATOR_PAGE_KEYS,
  recordCalculatorPageVisit,
  syncVisitAfterContactSubmit,
} from '../lib/calculatorPageVisits';
import { buildSports3SponsorshipEmailFields } from '../lib/calculatorEmailPersonalization';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import {
  buildSports3LockedCards,
  computeSports3SponsorshipMetrics,
} from '../lib/sports3SponsorshipCalculatorMath';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import { sendSportsHeyyouPdf } from '../lib/sendSportsHeyyouPdf';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  scheduleFormSubmit,
} from './CalculatorStepFlow';

const LEAD_SOURCE = 'sports3_calculator';
const LEAD_CAMPAIGN = 'sports3-sponsorship-calculator';
const TOTAL_STEPS = 4;
const STEP_FIELDS = ['revenue', 'sponsors', 'fulfillment', 'sensitivity'];

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    n || 0
  );

const Sports3SponsorshipCalculator = () => {
  const [searchParams] = useSearchParams();
  const { fire: fireEngagement, trackStartedOnce } = useLeadEventTracker(LEAD_SOURCE);
  const calculatorVisitIdRef = useRef(null);
  const formRef = useRef(null);

  const [totalSponsorshipRevenue, setTotalSponsorshipRevenue] = useState('480000');
  const [numSponsors, setNumSponsors] = useState('12');
  const [avgActivationFulfillment, setAvgActivationFulfillment] = useState('71');
  const [renewalSensitivity, setRenewalSensitivity] = useState('68');
  const [resultsShown, setResultsShown] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepField = STEP_FIELDS[currentStep];

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.SPORTS3_CALCULATOR,
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
    () => (snapshot ? buildSports3LockedCards(snapshot, formatMoney) : []),
    [snapshot]
  );

  const handleCalculate = (ev) => {
    ev.preventDefault();

    const revenue = parseFloat(totalSponsorshipRevenue);
    const sponsors = parseFloat(numSponsors);
    const fulfillment = parseFloat(avgActivationFulfillment);
    const sensitivity = parseFloat(renewalSensitivity);

    if (
      !Number.isFinite(revenue) ||
      revenue <= 0 ||
      !Number.isFinite(sponsors) ||
      sponsors <= 0 ||
      !Number.isFinite(fulfillment) ||
      fulfillment < 30 ||
      fulfillment > 100 ||
      !Number.isFinite(sensitivity) ||
      sensitivity < 0 ||
      sensitivity > 100
    ) {
      return;
    }

    const metrics = computeSports3SponsorshipMetrics({
      totalSponsorshipRevenue: revenue,
      numSponsors: sponsors,
      avgActivationFulfillment: fulfillment,
      renewalSensitivity: sensitivity,
    });

    setSnapshot(metrics);
    setResultsShown(true);
    fireEngagement('calculator_completed', 'interact');
  };

  const validateCurrentStep = () => {
    if (currentStepField === 'revenue') {
      const revenue = parseFloat(totalSponsorshipRevenue);
      if (!Number.isFinite(revenue) || revenue <= 0) return false;
    }
    if (currentStepField === 'sponsors') {
      const sponsors = parseFloat(numSponsors);
      if (!Number.isFinite(sponsors) || sponsors <= 0) return false;
    }
    if (currentStepField === 'fulfillment') {
      const fulfillment = parseFloat(avgActivationFulfillment);
      if (!Number.isFinite(fulfillment) || fulfillment < 30 || fulfillment > 100) return false;
    }
    if (currentStepField === 'sensitivity') {
      const sensitivity = parseFloat(renewalSensitivity);
      if (!Number.isFinite(sensitivity) || sensitivity < 0 || sensitivity > 100) return false;
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
        computeSports3SponsorshipMetrics({
          totalSponsorshipRevenue,
          numSponsors,
          avgActivationFulfillment,
          renewalSensitivity,
        });

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: {
            fullName: contactPayload.firstName,
            email: contactPayload.email,
            phone: contactPayload.phone,
          },
          totalFans: metrics.numSponsors,
          averageOrderValue: metrics.revenue_per_sponsor,
          percentNeverOrdered: Math.round(100 - metrics.avgActivationFulfillment),
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
          calculatorEmailFields: buildSports3SponsorshipEmailFields(metrics),
        }),
        sendSportsHeyyouPdf({
          name: contactPayload.firstName,
          email: contactPayload.email,
          venueName: contactPayload.venueName,
          leftOnTable: metrics.full_portfolio_risk,
        }),
      ];

      return Promise.all(captureTasks).then((results) => {
        const pdfResult = results[2];
        const leadResult = results[1];
        if (pdfResult?.ok === false) {
          // eslint-disable-next-line no-console
          console.warn('[sports3 calculator] PDF email failed:', pdfResult.error);
        }
        if (leadResult?.ok === false && leadResult.error && leadResult.error !== 'not_configured') {
          return { ok: false };
        }
        return { ok: true };
      });
    },
    [snapshot, totalSponsorshipRevenue, numSponsors, avgActivationFulfillment, renewalSensitivity]
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
            eyebrow="The renewal risk hiding in your sponsor portfolio"
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
          />

          <CalculatorStepChrome currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                    {currentStepField === 'revenue' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor="sports3-revenue">
                          What&apos;s your total annual sponsorship revenue?
                        </label>
                        <input
                          id="sports3-revenue"
                          className="watch-vs-order-field-input"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="480000"
                          required
                          value={totalSponsorshipRevenue}
                          onFocus={trackStartedOnce}
                          onChange={(e) => {
                            trackStartedOnce();
                            setTotalSponsorshipRevenue(e.target.value);
                          }}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'sponsors' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor="sports3-sponsors">
                          How many active sponsors are in your portfolio right now?
                        </label>
                        <input
                          id="sports3-sponsors"
                          className="watch-vs-order-field-input"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="12"
                          required
                          value={numSponsors}
                          onFocus={trackStartedOnce}
                          onChange={(e) => {
                            trackStartedOnce();
                            setNumSponsors(e.target.value);
                          }}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'fulfillment' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor="sports3-fulfillment">
                          On average, what percent of sponsor activations actually get fulfilled? (industry avg is 71%)
                        </label>
                        <input
                          id="sports3-fulfillment"
                          className="watch-vs-order-field-input watch-vs-order-field-input--range"
                          type="range"
                          min="30"
                          max="100"
                          step="1"
                          value={avgActivationFulfillment}
                          onChange={(e) => {
                            trackStartedOnce();
                            setAvgActivationFulfillment(e.target.value);
                          }}
                        />
                      </div>
                    ) : null}

                    {currentStepField === 'sensitivity' ? (
                      <div className="watch-vs-order-field-group">
                        <label className="watch-vs-order-field-label" htmlFor="sports3-sensitivity">
                          What percent of your sponsors mention ROI proof when it&apos;s time to renew? (industry avg is 68%)
                        </label>
                        <input
                          id="sports3-sensitivity"
                          className="watch-vs-order-field-input watch-vs-order-field-input--range"
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={renewalSensitivity}
                          onChange={(e) => {
                            trackStartedOnce();
                            setRenewalSensitivity(e.target.value);
                          }}
                          onMouseUp={() => {
                            if (currentStep === TOTAL_STEPS - 1) {
                              scheduleFormSubmit(formRef);
                            }
                          }}
                        />
                      </div>
                    ) : null}

                    <CalculatorStepNav
                      showBack={currentStep > 0}
                      onBack={handleStepBack}
                      onNext={handleStepNext}
                      isLastStep={currentStep === TOTAL_STEPS - 1}
                      submitLabel="Show Me Where My Renewals Are at Risk"
                    />
        </form>
      ) : null}

      {resultsShown && snapshot ? (
        <SportsGatedCalculatorResults
          calculatorType="sports3"
          formatMoney={formatMoney}
          lockedCards={lockedCards}
          totalAmount={snapshot.full_portfolio_risk}
          totalBannerLabel="Total sponsorship revenue at risk"
          totalBannerSubline="This is what activation gaps and renewal uncertainty cost your venue annually."
          heroHeadline={
            <>
              SPONSORSHIP REVENUE AT RISK THIS RENEWAL CYCLE:{' '}
              <span className="leak-results__hero-card-figure">
                {formatMoney(snapshot.at_risk_revenue)}
              </span>
            </>
          }
          heroSubhead="Based on your fulfillment rate and sponsor renewal sensitivity"
          gateChecks={[
            'Full breakdown of all sponsorship risk metrics',
            '1 actionable fix you can put in place before renewal conversations',
          ]}
          onReportSubmit={handleReportSubmit}
          onConsultationCta={handleConsultationCta}
          gridAriaLabel="Sponsorship activation gap breakdown"
        />
      ) : null}
    </CalculatorHeroShell>
  );
};

export default Sports3SponsorshipCalculator;
