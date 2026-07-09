import React, { forwardRef } from 'react';

const CalculatorTotalLeakBanner = forwardRef(function CalculatorTotalLeakBanner(
  { totalLeak, formatMoney, subline, label },
  ref
) {
  return (
    <div
      ref={ref}
      className="calculator-total-leak-banner calculator-total-leak-banner--revealing"
      aria-live="polite"
    >
      <p className="calculator-total-leak-banner__label">
        {label || 'Your total annual revenue leak'}
      </p>
      <p className="calculator-total-leak-banner__amount">{formatMoney(totalLeak)}</p>
      <p className="calculator-total-leak-banner__subline">
        {subline ||
          "This is what friction is costing you every year. Here's where it's coming from."}
      </p>
    </div>
  );
});

export default CalculatorTotalLeakBanner;
