import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/CalculatorGlassCard.css';
import '../styles/CalculatorRangeField.css';
import {
  CALCULATOR_PAGE_KEYS,
  recordCalculatorPageVisit,
} from '../lib/calculatorPageVisits';
import CalculatorHeroShell from './CalculatorHeroShell';
import CalculatorHeroCardIntro from './CalculatorHeroCardIntro';
import CalculatorRangeField from './CalculatorRangeField';
import { CALCULATOR_RANGE_FIELDS } from '../lib/calculatorRangeConfig';
import {
  computeSportsLeadScore,
  HERO_ORDERING_OPTIONS,
  HERO_SPORTS_VENUE_OPTIONS,
} from '../lib/calculatorLeadScore';
import { computeWaitCalculatorMetrics } from '../lib/waitCalculatorMath';
import { useLeadEventTracker } from '../lib/useLeadEventTracker';
import {
  CalculatorStepChrome,
  CalculatorStepNav,
  CalculatorHeroSubhead,
  CalculatorSingleSelectButtons,
  useCalculatorAutoAdvance,
} from './CalculatorStepFlow';

const LEAD_SOURCE = 'magic_bands_calculator';
const TOTAL_STEPS = 4;
const PARKING_FEE = 15;

const MagicBandsCalculator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fire: fireEngagement, trackStartedOnce } = useLeadEventTracker(LEAD_SOURCE);
  const formRef = useRef(null);

  const [venueType, setVenueType] = useState('');
  const [orderingMethod, setOrderingMethod] = useState('');
  const [qualificationError, setQualificationError] = useState('');
  const [totalFans, setTotalFans] = useState('');
  const [averageOrderValue, setAverageOrderValue] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const { advanceAfterSelect } = useCalculatorAutoAdvance({
    currentStep,
    totalSteps: TOTAL_STEPS,
    setCurrentStep,
    onClearError: () => setQualificationError(''),
    onComplete: () => formRef.current?.requestSubmit(),
  });

  useEffect(() => {
    void recordCalculatorPageVisit({
      pageKey: CALCULATOR_PAGE_KEYS.MAGIC_BANDS_CALCULATOR,
      searchParams,
      persona: venueType || undefined,
      orderingMethod: orderingMethod || undefined,
      leadScore: computeSportsLeadScore({
        venueType: venueType || undefined,
        orderingMethod: orderingMethod || undefined,
      }),
    });
  }, [searchParams, venueType, orderingMethod]);

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

  const handleCalculate = (ev) => {
    ev.preventDefault();
    if (!validateCurrentStep()) return;

    const attendance = parseFloat(totalFans);
    const spend = parseFloat(averageOrderValue);
    const metrics = computeWaitCalculatorMetrics({
      peakNightCustomers: attendance,
      averageSpendPerCustomer: spend,
    });

    const parkingLoss = attendance * 0.7 * PARKING_FEE;

    fireEngagement('calculator_completed', 'interact');

    const params = new URLSearchParams(searchParams);
    params.set('amount', String(Math.round(metrics.missedRevenueThatNight)));
    params.set('lost_per_fan', String(spend));
    params.set('fans', String(Math.round(metrics.customersWhoWaited)));
    params.set('parking_loss', String(Math.round(parkingLoss)));

    navigate(`/calculator/magic-bands/results?${params.toString()}`);
  };

  return (
    <CalculatorHeroShell glassCard>
      <form ref={formRef} className="watch-vs-order-calc-body" onSubmit={handleCalculate}>
        <CalculatorHeroCardIntro
          eyebrow="Revenue Intelligence"
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
        />

        <CalculatorStepChrome currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {currentStep === 0 ? (
                  <div className="watch-vs-order-field-group">
                    <label className="watch-vs-order-field-label" htmlFor="magic-bands-venue">
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
                    <label className="watch-vs-order-field-label" htmlFor="magic-bands-ordering">
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
                  <CalculatorRangeField
                    id="magic-bands-attendance"
                    label="Average attendance on peak nights"
                    value={totalFans}
                    onChange={(nextValue) => {
                      trackStartedOnce();
                      setTotalFans(nextValue);
                    }}
                    onFocus={trackStartedOnce}
                    {...CALCULATOR_RANGE_FIELDS.peakAttendance}
                  />
                ) : null}

                {currentStep === 3 ? (
                  <CalculatorRangeField
                    id="magic-bands-spend"
                    label="Average spend per guest"
                    value={averageOrderValue}
                    onChange={(nextValue) => {
                      trackStartedOnce();
                      setAverageOrderValue(nextValue);
                    }}
                    onFocus={trackStartedOnce}
                    {...CALCULATOR_RANGE_FIELDS.averageSpend}
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
          submitLabel="Show Me What I'm Leaving on the Table"
        />
      </form>
    </CalculatorHeroShell>
  );
};

export default MagicBandsCalculator;
