import { useCallback, useEffect, useRef } from 'react';
import { resolveKnownLeadIdentity } from './leadIdentity';

let loadPromise = null;

function loadCalculatorTracker(calculatorName) {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.CalcTracker) return Promise.resolve();

  if (!loadPromise) {
    loadPromise = new Promise((resolve) => {
      const existing = document.querySelector('script[data-calc-tracker]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        if (window.CalcTracker) resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `${process.env.PUBLIC_URL || ''}/calculator-tracker.js`;
      script.async = true;
      script.setAttribute('data-calc-tracker', 'true');
      if (calculatorName) {
        script.setAttribute('data-calculator-name', calculatorName);
      }
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.body.appendChild(script);
    });
  }

  return loadPromise;
}

/**
 * Loads calculator-tracker.js once and registers this route in the engagement log.
 * @param {string} calculatorName kebab-case label, e.g. "calculator-wait", "sports-revenue"
 */
export function useCalculatorEngagementTracker(calculatorName) {
  const startedRef = useRef(false);

  useEffect(() => {
    let active = true;
    startedRef.current = false;

    void loadCalculatorTracker(calculatorName).then(() => {
      if (!active || !calculatorName) return;
      window.CALC_TRACKER_NAME = calculatorName;
      const knownIdentity = resolveKnownLeadIdentity(
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null,
      );
      if (Object.keys(knownIdentity).length > 0) {
        window.CalcTracker?.setContext?.(knownIdentity);
      }
      window.CalcTracker?.init?.(calculatorName);
    });

    return () => {
      active = false;
    };
  }, [calculatorName]);

  const setAttribution = useCallback((context) => {
    try {
      window.CalcTracker?.setContext?.(context);
    } catch (_err) {
      // fail silently
    }
  }, []);

  const fire = useCallback((eventType, metadata) => {
    try {
      window.CalcTracker?.fire?.(eventType, metadata);
    } catch (_err) {
      // fail silently
    }
  }, []);

  const trackStartedOnce = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fire('calculator_started');
  }, [fire]);

  const startedInputProps = useCallback(
    () => ({
      onFocus: trackStartedOnce,
      onChange: trackStartedOnce,
    }),
    [trackStartedOnce]
  );

  return { fire, trackStartedOnce, startedInputProps, setAttribution };
}
