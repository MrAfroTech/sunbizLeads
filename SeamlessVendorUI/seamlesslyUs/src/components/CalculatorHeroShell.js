import React from 'react';
import CalculatorHeroLayout from './CalculatorHeroLayout';
import '../styles/CalculatorHeroLayout.css';
import '../styles/CalculatorGlassCard.css';
import '../styles/CalculatorRangeField.css';

const CalculatorHeroShell = ({ children, className = '', introActive = false, glassCard = false }) => (
  <div
    className={[
      'content-page',
      'watch-vs-order-page',
      'watch-vs-order-page--hero',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <CalculatorHeroLayout introActive={introActive} glassCard={glassCard}>
      {children}
    </CalculatorHeroLayout>
  </div>
);

export default CalculatorHeroShell;
