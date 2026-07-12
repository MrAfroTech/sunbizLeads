import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { getRangeDefaultValue } from '../lib/calculatorRangeConfig';
import '../styles/CalculatorRangeField.css';

const RANGE_TRACK_GOLD = '#d4af37';

function applyRangeTrackFill(input) {
  if (!input) return;

  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  const pct = ((value - min) / (max - min)) * 100;

  input.style.background = `linear-gradient(to right, ${RANGE_TRACK_GOLD} ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
}

const CalculatorRangeField = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue = (v) => String(v),
  defaultValue,
  onFocus,
  onMouseUp,
  onBlur,
  helperText,
}) => {
  const inputRef = useRef(null);

  const resolvedDefault = useMemo(
    () => (defaultValue != null ? defaultValue : getRangeDefaultValue({ min, max, step })),
    [defaultValue, min, max, step]
  );

  const numericValue = useMemo(() => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return resolvedDefault;
  }, [value, resolvedDefault]);

  useEffect(() => {
    if (value === '' || value == null) {
      onChange(String(resolvedDefault));
    }
  }, []);

  useLayoutEffect(() => {
    applyRangeTrackFill(inputRef.current);
  }, [numericValue, min, max]);

  const handleRangeInput = (event) => {
    applyRangeTrackFill(event.target);
  };

  const handleRangeChange = (event) => {
    applyRangeTrackFill(event.target);
    onChange(event.target.value);
  };

  return (
    <div className="watch-vs-order-field-group calculator-range-field">
      <div className="calculator-range-field__header">
        {label ? (
          <label className="watch-vs-order-field-label calculator-range-field__label" htmlFor={id}>
            {label}
          </label>
        ) : null}
        <span className="calculator-range-field__value" aria-live="polite">
          {formatValue(numericValue)}
        </span>
      </div>
      <div className="calculator-range-field__track-row">
        <span className="calculator-range-field__bound">{formatValue(min)}</span>
        <div className="calculator-range-field__track">
          <input
            ref={inputRef}
            id={id}
            type="range"
            className="watch-vs-order-field-input watch-vs-order-field-input--range calculator-range-field__input"
            min={min}
            max={max}
            step={step}
            value={numericValue}
            onInput={handleRangeInput}
            onChange={handleRangeChange}
            onFocus={onFocus}
            onMouseUp={onMouseUp}
            onBlur={onBlur}
          />
        </div>
        <span className="calculator-range-field__bound">{formatValue(max)}</span>
      </div>
      {helperText ? <p className="calculator-range-field__helper">{helperText}</p> : null}
    </div>
  );
};

export default CalculatorRangeField;
