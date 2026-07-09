import React, { forwardRef } from 'react';

const LOCKED_PLACEHOLDER_AMOUNT = '$00,000';

const CalculatorResultCard = forwardRef(function CalculatorResultCard(
  {
    indexLabel,
    title,
    descriptor,
    amount,
    formatMoney,
    initiallyRevealed = false,
    isRevealed = false,
    spanFull = false,
  },
  ref
) {
  const showAmount = initiallyRevealed || isRevealed;
  const animateIn = isRevealed && !initiallyRevealed;

  return (
    <article
      ref={ref}
      className={[
        'moment-card',
        initiallyRevealed ? 'moment-card--hero' : '',
        showAmount && !initiallyRevealed ? 'moment-card--revealed' : '',
        !showAmount ? 'moment-card--locked' : '',
        animateIn ? 'moment-card--revealing' : '',
        spanFull ? 'moment-card--span-full' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'moment-card__unlock-badge',
          showAmount ? 'moment-card__unlock-badge--revealed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {showAmount ? 'Revealed' : (
          <>
            <span aria-hidden="true">🔒</span> Unlock
          </>
        )}
      </span>
      <div className="moment-card__body">
        {indexLabel ? <span className="moment-card__index">{indexLabel}</span> : null}
        <h4 className="moment-card__name">{title}</h4>
        {descriptor ? <p className="moment-card__descriptor">{descriptor}</p> : null}
      </div>
      <div
        className={[
          'moment-card__amount',
          (initiallyRevealed || spanFull) && showAmount ? 'moment-card__amount--hero' : '',
          !showAmount ? 'moment-card__amount--redacted' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={!showAmount}
      >
        {showAmount ? formatMoney(amount) : LOCKED_PLACEHOLDER_AMOUNT}
      </div>
    </article>
  );
});

export default CalculatorResultCard;
