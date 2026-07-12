import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/CalculatorGlassCard.css';
import '../styles/CalculatorRangeField.css';
import SportsGatedCalculatorResults from './SportsGatedCalculatorResults';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import CalculatorRangeField from './CalculatorRangeField';
import { getForkStepRangeProps } from '../lib/calculatorRangeConfig';
import {
  recordCalculatorPageVisit,
  syncVisitAfterContactSubmit,
} from '../lib/calculatorPageVisits';
import { buildForkEmailFields } from '../lib/calculatorEmailPersonalization';
import { getForkCalculatorConfig } from '../lib/forkCalculatorRegistry';
import { recordSportsJourneyCalculate } from '../lib/sportsRevenueJourney';
import { sendSportsHeyyouPdf } from '../lib/sendSportsHeyyouPdf';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import { submitUnifiedLead } from '../lib/submitUnifiedLead';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  scheduleFormSubmit,
} from './CalculatorStepFlow';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    n || 0
  );

function buildInitialInputs(steps) {
  return Object.fromEntries(steps.map((step) => [step.id, step.defaultValue]));
}

function validateStepField(step, value) {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return false;
  if (step.inputType === 'number') {
    const min = step.min ?? 0.01;
    return num >= min;
  }
  if (step.inputType === 'range') {
    return num >= (step.min ?? 0) && num <= (step.max ?? 100);
  }
  return true;
}

function validateAllSteps(steps, inputs) {
  return steps.every((step) => validateStepField(step, inputs[step.id]));
}

const GatedForkCalculator = ({ configId }) => {
  const config = getForkCalculatorConfig(configId);
  const [searchParams] = useSearchParams();
  const { fire: fireEngagement, trackStartedOnce } = useLeadEventTracker(config?.leadSource ?? 'fork_calculator');
  const calculatorVisitIdRef = useRef(null);
  const formRef = useRef(null);

  const [inputs, setInputs] = useState(() => (config ? buildInitialInputs(config.steps) : {}));
  const [resultsShown, setResultsShown] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = config?.steps.length ?? 0;
  const currentStepField = config?.steps[currentStep];

  useEffect(() => {
    if (!config) return;
    void recordCalculatorPageVisit({
      pageKey: config.pageKey,
      searchParams,
    }).then((id) => {
      if (id) calculatorVisitIdRef.current = id;
    });
  }, [config, searchParams]);

  useEffect(() => {
    if (resultsShown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [resultsShown]);

  const lockedCards = useMemo(
    () => (snapshot && config ? config.buildLockedCards(snapshot, formatMoney) : []),
    [snapshot, config]
  );

  if (!config) {
    return (
      <div className="content-page watch-vs-order-page">
        <div className="watch-vs-order-container">
          <p>Calculator not found.</p>
        </div>
      </div>
    );
  }

  const handleCalculate = (ev) => {
    ev.preventDefault();
    if (!validateAllSteps(config.steps, inputs)) return;

    const metrics = config.computeMetrics(inputs);
    setSnapshot(metrics);
    setResultsShown(true);
    fireEngagement('calculator_completed', 'interact');
  };

  const handleStepNext = () => {
    if (!currentStepField || !validateStepField(currentStepField, inputs[currentStepField.id])) return;
    setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
  };

  const handleStepBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const runContactCaptureFlow = useCallback(
    (contactPayload) => {
      const metrics = snapshot || config.computeMetrics(inputs);
      const journey = config.journeyMap?.(metrics) ?? {};

      const captureTasks = [
        recordSportsJourneyCalculate({
          contact: {
            fullName: contactPayload.firstName,
            email: contactPayload.email,
            phone: contactPayload.phone,
          },
          totalFans: journey.totalFans ?? 0,
          averageOrderValue: journey.averageOrderValue ?? 0,
          percentNeverOrdered: journey.percentNeverOrdered ?? 0,
          leadScore: 50,
        }),
        submitUnifiedLead({
          email: contactPayload.email,
          name: contactPayload.firstName,
          phone: contactPayload.phone,
          source: config.leadSource,
          campaign: config.leadCampaign,
          visitId: calculatorVisitIdRef.current,
          visitContact: {
            name: `${contactPayload.firstName} — ${contactPayload.venueName}`,
            email: contactPayload.email,
            phone: contactPayload.phone,
            lastClickCampaign: config.leadCampaign,
            leadScore: 50,
          },
          calculatorEmailFields: buildForkEmailFields(metrics, config.frictionZone),
        }),
        sendSportsHeyyouPdf({
          name: contactPayload.firstName,
          email: contactPayload.email,
          venueName: contactPayload.venueName,
          leftOnTable: config.getTotalAmount(metrics),
        }),
      ];

      return Promise.all(captureTasks).then((results) => {
        const pdfResult = results[2];
        const leadResult = results[1];
        if (pdfResult?.ok === false) {
          // eslint-disable-next-line no-console
          console.warn(`[${configId} calculator] PDF email failed:`, pdfResult.error);
        }
        if (leadResult?.ok === false && leadResult.error && leadResult.error !== 'not_configured') {
          return { ok: false };
        }
        return { ok: true };
      });
    },
    [config, configId, inputs, snapshot]
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
        leadScore: contact.leadScore ?? 50,
      });
      return { ok: true };
    },
    [fireEngagement, runContactCaptureFlow]
  );

  const handleConsultationCta = useCallback(() => {
    fireEngagement('consultation_cta_clicked', 'interact');
  }, [fireEngagement]);

  const heroAmount = snapshot ? formatMoney(config.getTotalAmount(snapshot)) : '';

  return (
    <CalculatorHeroShell glassCard>
      {!resultsShown ? (
        <form ref={formRef} className="watch-vs-order-calc-body" onSubmit={handleCalculate}>
          <CalculatorHeroCardIntro
            eyebrow={config.eyebrow}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />

          <CalculatorStepChrome currentStep={currentStep} totalSteps={totalSteps} />

          {currentStepField ? (
                      <CalculatorRangeField
                        id={`${configId}-${currentStepField.id}`}
                        label={currentStepField.label}
                        value={inputs[currentStepField.id]}
                        onChange={(nextValue) => {
                          trackStartedOnce();
                          setInputs((prev) => ({ ...prev, [currentStepField.id]: nextValue }));
                        }}
                        onFocus={trackStartedOnce}
                        defaultValue={Number(currentStepField.defaultValue)}
                        onBlur={
                          currentStep === totalSteps - 1 && currentStepField.inputType === 'number'
                            ? () => {
                                if (validateStepField(currentStepField, inputs[currentStepField.id])) {
                                  scheduleFormSubmit(formRef);
                                }
                              }
                            : undefined
                        }
                        onMouseUp={
                          currentStep === totalSteps - 1 && currentStepField.inputType === 'range'
                            ? () => scheduleFormSubmit(formRef)
                            : undefined
                        }
                        {...getForkStepRangeProps(currentStepField)}
                      />
                    ) : null}

                    <CalculatorStepNav
                      showBack={currentStep > 0}
                      onBack={handleStepBack}
                      onNext={handleStepNext}
                      isLastStep={currentStep === totalSteps - 1}
                      submitLabel={config.submitLabel}
                    />
        </form>
      ) : null}

      {resultsShown && snapshot ? (
        <SportsGatedCalculatorResults
          calculatorType={config.calculatorType}
          formatMoney={formatMoney}
          lockedCards={lockedCards}
          totalAmount={config.getTotalAmount(snapshot)}
          totalBannerLabel={config.totalBannerLabel}
          totalBannerSubline={config.totalBannerSubline}
          heroHeadline={
            <>
              {config.heroHeadlinePrefix}{' '}
              <span className="leak-results__hero-card-figure">{heroAmount}</span>
            </>
          }
          heroSubhead={config.heroSubhead}
          gateChecks={config.gateChecks}
          onReportSubmit={handleReportSubmit}
          onConsultationCta={handleConsultationCta}
          gridAriaLabel={config.gridAriaLabel}
        />
      ) : null}
    </CalculatorHeroShell>
  );
};

export default GatedForkCalculator;
