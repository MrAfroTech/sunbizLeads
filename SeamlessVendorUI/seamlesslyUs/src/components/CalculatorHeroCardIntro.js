import React from 'react';
import { CalculatorHeroSubhead, getCalculatorFormStepHeadline } from './CalculatorStepFlow';

const CalculatorHeroCardIntro = ({
  eyebrow,
  title,
  currentStep,
  totalSteps,
  showDuration = true,
}) => {
  const resolvedTitle =
    title ??
    (typeof currentStep === 'number' && typeof totalSteps === 'number'
      ? getCalculatorFormStepHeadline(currentStep, totalSteps)
      : null);

  return (
    <>
      {eyebrow ? <p className="watch-vs-order-hero-eyebrow">{eyebrow}</p> : null}
      {resolvedTitle ? <h1 className="watch-vs-order-title">{resolvedTitle}</h1> : null}
      {showDuration ? <CalculatorHeroSubhead /> : null}
    </>
  );
};

export default CalculatorHeroCardIntro;
