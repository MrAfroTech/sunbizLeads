import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WaitCalculator from '../components/WaitCalculator';
import '../styles/MakingPurchaseVsWatchingGame.css';
import '../styles/WaitSignalSlides.css';
import {
  QR_SCAN_ADOPTION_RATE,
  REPEAT_VS_ANONYMOUS_SPEND_PREMIUM,
  WAIT_FRICTION_REVENUE_LEAK_RATE,
  QR_GUEST_INTELLIGENCE_CAPTURE,
  LABOR_WASTE_RATE,
  LABOR_SAVINGS_ANNUAL,
  formatMoney,
  formatPercent,
} from '../lib/waitSignalBenchmarks';

const SLIDE_COUNT = 7;
const TOTAL_STEPS = SLIDE_COUNT + 1;
const COMPOUND_STEPS = 4;

const HeyYouMark = ({ light = false }) => (
  <div className={`wss-wordmark${light ? ' wss-wordmark--light' : ''}`}>
    <span>Hey</span>
    <strong>You</strong>
  </div>
);

const WaitSignalSlides = () => {
  const [searchParams] = useSearchParams();
  const isPresenter = searchParams.get('presenter') === '1';
  const [currentStep, setCurrentStep] = useState(0);
  const [compoundStep, setCompoundStep] = useState(0);
  const [calculatorResultsReady, setCalculatorResultsReady] = useState(false);

  useEffect(() => {
    setCompoundStep(0);
  }, [currentStep]);

  const canAdvanceFromCalculator = calculatorResultsReady;

  const advance = useCallback(() => {
    if (currentStep === 0 && !canAdvanceFromCalculator) {
      return;
    }
    if (currentStep === 5 && compoundStep < COMPOUND_STEPS) {
      setCompoundStep((prev) => prev + 1);
      return;
    }
    if (currentStep < SLIDE_COUNT) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canAdvanceFromCalculator, compoundStep, currentStep]);

  const retreat = useCallback(() => {
    if (currentStep === 5 && compoundStep > 0) {
      setCompoundStep((prev) => prev - 1);
      return;
    }
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [compoundStep, currentStep]);

  const handleCalculatorResultsShown = useCallback(() => {
    setCalculatorResultsReady(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      const isTyping =
        tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (isTyping && currentStep === 0 && !calculatorResultsReady) {
          return;
        }
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (isTyping && currentStep === 0) {
          return;
        }
        e.preventDefault();
        retreat();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [advance, retreat, calculatorResultsReady, currentStep]);

  const handleSlideClick = (e) => {
    if (e.target.closest('a, button, input, select, textarea, label')) return;
    advance();
  };

  const renderSlide = (step) => {
    switch (step) {
      case 1:
        return (
          <div className="wss-slide wss-slide--navy" onClick={handleSlideClick} role="presentation">
            <HeyYouMark light />
            <div className="wss-slide__content wss-slide__content--wide">
              <h1 className="wss-slide-heading">But The Data Disappears</h1>
              <div className="wss-split">
                <div className="wss-split__panel wss-split__panel--closed">
                  <span className="wss-split__label">Transaction</span>
                  <div className="wss-split__status wss-split__status--done">Closed</div>
                </div>
                <div className="wss-split__panel wss-split__panel--blank">
                  <span className="wss-split__label">Guest profile</span>
                  <div className="wss-profile-blank">
                    <span className="wss-profile-blank__line" />
                    <span className="wss-profile-blank__line wss-profile-blank__line--short" />
                    <span className="wss-profile-blank__line wss-profile-blank__line--shorter" />
                  </div>
                </div>
              </div>
              <p className="wss-callout">
                The order closed. The guest vanished. Every visit starts at zero.
              </p>
              <p className="wss-voice-line">
                That&apos;s not a QR problem. That&apos;s a guest intelligence problem.
              </p>
            </div>
            <span className="wss-ghost-num" aria-hidden="true">01</span>
          </div>
        );

      case 2:
        return (
          <div className="wss-slide wss-slide--navy" onClick={handleSlideClick} role="presentation">
            <HeyYouMark light />
            <div className="wss-slide__content">
              <h1 className="wss-slide-heading">The Scan Is Already Happening</h1>
              <p className="wss-stat-line">
                <span className="wss-stat-line__num">{formatPercent(QR_SCAN_ADOPTION_RATE)}</span>
                {' '}of diners have scanned a QR code to order since 2021.
              </p>
              <p className="wss-voice-line">
                Your guests already know what to do. The behavior is locked in.
              </p>
            </div>
            <span className="wss-ghost-num" aria-hidden="true">02</span>
          </div>
        );

      case 3:
        return (
          <div className="wss-slide wss-slide--navy" onClick={handleSlideClick} role="presentation">
            <HeyYouMark light />
            <div className="wss-slide__content">
              <h1 className="wss-slide-heading">The Revenue Signal</h1>
              <ul className="wss-stat-stack">
                <li>
                  <span className="wss-stat-stack__value wss-stat-stack__value--teal">
                    +{formatPercent(REPEAT_VS_ANONYMOUS_SPEND_PREMIUM)}
                  </span>
                  <span className="wss-stat-stack__dash">—</span>
                  <span className="wss-stat-stack__label">
                    What repeat guests spend vs anonymous first-timers
                  </span>
                </li>
                <li>
                  <span className="wss-stat-stack__value wss-stat-stack__value--gold">
                    {formatPercent(WAIT_FRICTION_REVENUE_LEAK_RATE)}
                  </span>
                  <span className="wss-stat-stack__dash">—</span>
                  <span className="wss-stat-stack__label">
                    Revenue left on the table when wait friction goes unaddressed
                  </span>
                </li>
                <li>
                  <span className="wss-stat-stack__value">{formatMoney(QR_GUEST_INTELLIGENCE_CAPTURE)}</span>
                  <span className="wss-stat-stack__dash">—</span>
                  <span className="wss-stat-stack__label">
                    What most QR systems capture about who just spent money with you
                  </span>
                </li>
              </ul>
              <p className="wss-voice-line">
                The money is already in the room. You just can&apos;t see it.
              </p>
            </div>
            <span className="wss-ghost-num" aria-hidden="true">03</span>
          </div>
        );

      case 4:
        return (
          <div className="wss-slide wss-slide--navy" onClick={handleSlideClick} role="presentation">
            <HeyYouMark light />
            <div className="wss-slide__content">
              <h1 className="wss-slide-heading">The Operations Signal</h1>
              <div className="wss-stat-pair">
                <p className="wss-stat-pair__row">
                  <span className="wss-stat-pair__value wss-stat-pair__value--teal">
                    {formatPercent(LABOR_WASTE_RATE)}
                  </span>
                  <span className="wss-stat-pair__label">
                    Labor cost reduction with data-driven scheduling
                  </span>
                </p>
                <p className="wss-stat-pair__row">
                  <span className="wss-stat-pair__value wss-stat-pair__value--gold">
                    {formatMoney(LABOR_SAVINGS_ANNUAL)}/yr
                  </span>
                  <span className="wss-stat-pair__label">
                    Saved per location when you forecast off real visit patterns
                  </span>
                </p>
              </div>
              <p className="wss-voice-line wss-voice-line--wide">
                The wait time isn&apos;t just a service metric. It&apos;s your scheduling data.
                Your inventory data. Your margin data.
              </p>
            </div>
            <span className="wss-ghost-num" aria-hidden="true">04</span>
          </div>
        );

      case 5:
        return (
          <div className="wss-slide wss-slide--navy" onClick={handleSlideClick} role="presentation">
            <HeyYouMark light />
            <div className="wss-slide__content wss-slide__content--wide">
              <h1 className="wss-slide-heading">The Compounding Effect</h1>
              <div className="wss-compound">
                {[
                  { pillar: 'Revenue', action: 'Recognize the guest', accent: 'teal' },
                  { pillar: 'Labor', action: 'Staff to actual demand', accent: 'gold' },
                  { pillar: 'Inventory', action: 'Buy to actual consumption', accent: 'teal' },
                ].map((col, index) => (
                  <div
                    key={col.pillar}
                    className={[
                      'wss-compound__col',
                      `wss-compound__col--${col.accent}`,
                      compoundStep > index ? 'wss-compound__col--lit' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="wss-compound__pillar">{col.pillar}</span>
                    <span className="wss-compound__arrow">→</span>
                    <span className="wss-compound__action">{col.action}</span>
                  </div>
                ))}
              </div>
              <p
                className={[
                  'wss-compound__result',
                  compoundStep >= COMPOUND_STEPS ? 'wss-compound__result--lit' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                = Margin separation
              </p>
              <p className="wss-voice-line">
                Fix one, you move. Fix all three, you separate from every operator who&apos;s still
                guessing.
              </p>
            </div>
            <span className="wss-ghost-num" aria-hidden="true">05</span>
          </div>
        );

      case 6:
        return (
          <div className="wss-slide wss-slide--reveal" onClick={handleSlideClick} role="presentation">
            <HeyYouMark light />
            <div className="wss-slide__content">
              <p className="wss-reveal-line">HeyYou isn&apos;t a QR tool.</p>
              <p className="wss-reveal-line wss-reveal-line--emphasis">
                It&apos;s the intelligence layer that should have been there from the first scan.
              </p>
              <p className="wss-voice-line">
                Same behavior your guests already have. Now it actually runs your business.
              </p>
            </div>
            <span className="wss-ghost-num wss-ghost-num--gold" aria-hidden="true">06</span>
          </div>
        );

      case 7:
        return (
          <div className="wss-slide wss-slide--close">
            <HeyYouMark />
            <div className="wss-slide__content">
              <h1 className="wss-slide-heading wss-slide-heading--navy">One Question</h1>
              <p className="wss-close-question">Do these numbers show up in your operation?</p>
              <p className="wss-close-subline">
                Let&apos;s run your actual figures. 30 minutes. The calculator decides — not us.
              </p>

              <div className="wss-close-actions">
                <div className="wss-qr-box" aria-label="QR code placeholder">
                  <div className="wss-qr-box__frame">
                    <span className="wss-qr-box__placeholder" aria-hidden="true" />
                    <span className="wss-qr-box__label">QR code</span>
                  </div>
                  <p className="wss-qr-box__hint">Scan to book your session</p>
                </div>

                <div className="wss-close-divider">
                  <span>or</span>
                </div>

                <div className="calculator-schedule-cta wss-close-cta">
                  <Link to="/demo" className="calculator-schedule-cta__button">
                    seamlessly.us/demo
                  </Link>
                </div>
              </div>
            </div>
            <span className="wss-ghost-num wss-ghost-num--navy" aria-hidden="true">07</span>
          </div>
        );

      default:
        return null;
    }
  };

  const isCloseSlide = currentStep === SLIDE_COUNT;

  return (
    <div
      className={[
        'wss-deck',
        isCloseSlide ? 'wss-deck--light' : '',
        isPresenter ? 'wss-deck--presenter' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'wss-calculator-layer',
          currentStep === 0 ? 'wss-calculator-layer--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <p className="wss-calc-script" aria-hidden={!isPresenter}>
          500 guests. $42 average. Watch what the data says.
        </p>
        <WaitCalculator
          presentationMode
          onPresentationResultsShown={handleCalculatorResultsShown}
        />
        {calculatorResultsReady && currentStep === 0 && (
          <button
            type="button"
            className="wss-advance-arrow"
            onClick={advance}
            aria-label="Continue to slides"
          >
            <ChevronRight size={26} strokeWidth={2} />
          </button>
        )}
      </div>

      {currentStep > 0 && (
        <div className="wss-slides-layer">{renderSlide(currentStep)}</div>
      )}

      <nav className="wss-nav" aria-label="Presentation navigation">
        <button
          type="button"
          className="wss-nav__btn"
          onClick={retreat}
          disabled={currentStep === 0}
          aria-label="Previous"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="wss-nav__dots" aria-label={`Step ${currentStep + 1} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <span
              key={index}
              className={[
                'wss-nav__dot',
                index === currentStep ? 'wss-nav__dot--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>

        <button
          type="button"
          className="wss-nav__btn"
          onClick={advance}
          disabled={
            currentStep === SLIDE_COUNT ||
            (currentStep === 0 && !canAdvanceFromCalculator)
          }
          aria-label="Next"
        >
          <ChevronRight size={28} />
        </button>
      </nav>
    </div>
  );
};

export default WaitSignalSlides;
