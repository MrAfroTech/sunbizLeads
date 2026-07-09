import React, { useCallback, useEffect, useRef, useState } from 'react';

const COUNTDOWN_MS = 60_000;

export const CALCULATOR_HERO_DURATION_LABEL = 'Takes about 45 seconds';

export const CALCULATOR_FORM_STEP_HEADLINES = [
  "Let's start with the basics",
  'A Personalized Revenue Boost Estimate.',
  'Almost There—Your Revenue Report Is Waiting',
  "Last Step and you'll get your results",
];

export function getCalculatorFormStepHeadline(currentStep, totalSteps) {
  const lastIndex = CALCULATOR_FORM_STEP_HEADLINES.length - 1;
  if (typeof totalSteps === 'number' && totalSteps > 0 && totalSteps <= CALCULATOR_FORM_STEP_HEADLINES.length) {
    return CALCULATOR_FORM_STEP_HEADLINES[Math.min(currentStep, totalSteps - 1)];
  }
  return CALCULATOR_FORM_STEP_HEADLINES[Math.min(currentStep, lastIndex)];
}

/** @deprecated Use CALCULATOR_HERO_DURATION_LABEL — countdown removed from hero layout. */
export const CALCULATOR_HERO_SUBHEADLINE = CALCULATOR_HERO_DURATION_LABEL;

export function useCalculatorCountdown(active = true) {
  const [msLeft, setMsLeft] = useState(COUNTDOWN_MS);
  const startedAtRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }

    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setMsLeft(Math.max(0, COUNTDOWN_MS - elapsed));
    }, 10);

    return () => window.clearInterval(id);
  }, [active]);

  const secondsLeft = Math.floor(msLeft / 1000);
  const milliseconds = msLeft % 1000;
  const timerDisplay = `0:${String(secondsLeft).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;

  return { secondsLeft, msLeft, timerDisplay };
}

export function useCalculatorAutoAdvance({ currentStep, totalSteps, setCurrentStep, onClearError, onComplete }) {
  const advanceAfterSelect = useCallback(() => {
    onClearError?.();
    if (currentStep >= totalSteps - 1) {
      onComplete?.();
      return;
    }
    setCurrentStep((step) => step + 1);
  }, [currentStep, totalSteps, setCurrentStep, onClearError, onComplete]);

  return { advanceAfterSelect };
}

export function scheduleFormSubmit(formRef) {
  window.setTimeout(() => formRef.current?.requestSubmit(), 0);
}

export function CalculatorHeroSubhead({
  className = 'watch-vs-order-hero-sub calculator-step-flow__duration-label',
}) {
  return <p className={className}>{CALCULATOR_HERO_DURATION_LABEL}</p>;
}

export function CalculatorStepChrome({ currentStep, totalSteps, questionOffset = 0 }) {
  const questionNumber = currentStep + 1 + questionOffset;
  const questionTotal = totalSteps + questionOffset;
  const progressPercent = Math.min(100, Math.round((questionNumber / questionTotal) * 100));

  return (
    <div className="calculator-step-flow__chrome">
      <div
        className="calculator-step-flow__progress"
        role="progressbar"
        aria-valuenow={questionNumber}
        aria-valuemin={1}
        aria-valuemax={questionTotal}
        aria-label={`Question ${questionNumber} of ${questionTotal}`}
      >
        <div className="calculator-step-flow__progress-track">
          <div
            className="calculator-step-flow__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function CalculatorStepNav({
  showBack,
  onBack,
  onNext,
  isLastStep,
  submitLabel,
  nextDisabled = false,
}) {
  return (
    <div className="calculator-step-flow__nav">
      {showBack ? (
        <button
          type="button"
          className="calculator-step-flow__back"
          onClick={onBack}
        >
          ← Back
        </button>
      ) : null}
      <button
        type={isLastStep ? 'submit' : 'button'}
        className="watch-vs-order-cta-btn"
        onClick={isLastStep ? undefined : onNext}
        disabled={nextDisabled}
      >
        {isLastStep ? submitLabel : 'Next →'}
      </button>
    </div>
  );
}

export function CalculatorCondensedStat({ text }) {
  if (!text) return null;

  return (
    <div
      className="calculator-step-flow__condensed-stat"
      style={{
        fontSize: '0.8rem',
        lineHeight: 1.4,
        marginBottom: '16px',
      }}
    >
      {text}
    </div>
  );
}

function getOptionGridStyle(count) {
  const gap = '10px';

  if (count <= 1) {
    return { display: 'grid', gridTemplateColumns: '1fr', gap };
  }

  return { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap };
}

export function CalculatorSingleSelectButtons({
  options,
  value,
  onChange,
  name,
  onSelect,
  autoAdvance = false,
  onAdvance,
}) {
  const items = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option
  );

  return (
    <div
      className="calculator-step-flow__option-grid"
      role="group"
      aria-label={name}
      style={getOptionGridStyle(items.length)}
    >
      {items.map((option, index) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            name={name}
            className="calculator-step-flow__option-btn"
            aria-pressed={selected}
            onClick={() => {
              onChange(option.value);
              onSelect?.(option.value);
              if (autoAdvance) {
                window.setTimeout(() => onAdvance?.(), 0);
              }
            }}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              padding: '14px 12px',
              fontSize: '0.9rem',
              lineHeight: 1.35,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
