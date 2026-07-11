import React from 'react';
import '../styles/CalculatorHeroLayout.css';
import { CALCULATOR_HERO_BACKGROUND_IMAGE } from '../lib/calculatorHeroImages';

const CalculatorHeroLayout = ({ children, introActive = false, glassCard = false }) => {
  const year = new Date().getFullYear();

  return (
    <div
      className={[
        'calculator-hero-layout',
        introActive ? 'calculator-hero-layout--intro' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="calculator-hero-layout__frame">
        <div
          className="calculator-hero-layout__bg"
          style={{ backgroundImage: `url(${CALCULATOR_HERO_BACKGROUND_IMAGE})` }}
          aria-hidden="true"
        />
        <div className="calculator-hero-layout__scrim" aria-hidden="true" />

        <img
          src="/seamlessly-logo.svg"
          alt=""
          className="calculator-hero-layout__logo calculator-hero-layout__logo--tl"
          aria-hidden="true"
        />
        <img
          src="/seamlessly-logo.svg"
          alt=""
          className="calculator-hero-layout__logo calculator-hero-layout__logo--br"
          aria-hidden="true"
        />

        <div className="calculator-hero-layout__profit" aria-hidden="true">
          Profit
        </div>

        <div className="calculator-hero-layout__content">
          <div
            className={[
              'calculator-hero-layout__card',
              glassCard ? 'calculator-glass-card' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {children}
          </div>
        </div>
      </div>

      <footer className="calculator-hero-layout__legal">
        <a href="/terms-of-service">Terms</a>
        <a href="/privacy-policy">Privacy Policy</a>
        <span>© {year} Seamlessly</span>
      </footer>
    </div>
  );
};

export default CalculatorHeroLayout;
