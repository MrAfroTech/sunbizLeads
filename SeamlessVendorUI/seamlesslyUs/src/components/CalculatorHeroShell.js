import React from 'react';
import CalculatorHeroLayout from './CalculatorHeroLayout';
import '../styles/CalculatorHeroLayout.css';

const CalculatorHeroShell = ({ children, className = '', introActive = false }) => (
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
    <CalculatorHeroLayout introActive={introActive}>{children}</CalculatorHeroLayout>
  </div>
);

export default CalculatorHeroShell;
