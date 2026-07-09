import { useCallback, useEffect, useRef, useState } from 'react';
import { fireCalculatorEngagementEvent } from '../lib/fireCalculatorEngagementEvent';
import { scrollElementBelowNav } from '../lib/scrollBelowNav';

export const CALCULATOR_REVEAL_STAGGER_MS = 150;
/** Banner animates first; locked cards stagger after this delay. */
export const CALCULATOR_BANNER_REVEAL_MS = 150;

/**
 * Shared staggered reveal after phone gate submit.
 * @param {{ calculatorType: string, lockedCardCount: number }} options
 */
export function useCalculatorReveal({ calculatorType, lockedCardCount }) {
  const [phoneUnlocked, setPhoneUnlocked] = useState(false);
  const [revealedLockedCount, setRevealedLockedCount] = useState(0);
  const [showPostReveal, setShowPostReveal] = useState(false);
  const fullRevealFiredRef = useRef(false);
  const timersRef = useRef([]);
  const revealAnchorRef = useRef(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!phoneUnlocked) return undefined;

    const scrollTimer = window.setTimeout(() => {
      scrollElementBelowNav(revealAnchorRef.current);
    }, 50);

    return () => window.clearTimeout(scrollTimer);
  }, [phoneUnlocked]);

  const beginStaggeredReveal = useCallback(() => {
    clearTimers();
    setPhoneUnlocked(true);
    setShowPostReveal(false);
    setRevealedLockedCount(0);

    if (lockedCardCount <= 0) {
      setShowPostReveal(true);
      if (!fullRevealFiredRef.current) {
        fullRevealFiredRef.current = true;
        void fireCalculatorEngagementEvent(calculatorType, 'full_reveal');
      }
      return;
    }

    for (let index = 0; index < lockedCardCount; index += 1) {
      const timerId = window.setTimeout(() => {
        setRevealedLockedCount(index + 1);
      }, CALCULATOR_BANNER_REVEAL_MS + index * CALCULATOR_REVEAL_STAGGER_MS);
      timersRef.current.push(timerId);
    }

    const postRevealDelay =
      CALCULATOR_BANNER_REVEAL_MS +
      (lockedCardCount - 1) * CALCULATOR_REVEAL_STAGGER_MS +
      50;
    const postRevealTimer = window.setTimeout(() => {
      setShowPostReveal(true);
      if (!fullRevealFiredRef.current) {
        fullRevealFiredRef.current = true;
        void fireCalculatorEngagementEvent(calculatorType, 'full_reveal');
      }
    }, postRevealDelay);
    timersRef.current.push(postRevealTimer);
  }, [calculatorType, clearTimers, lockedCardCount]);

  const isLockedCardRevealed = useCallback(
    (lockedIndex) => phoneUnlocked && lockedIndex < revealedLockedCount,
    [phoneUnlocked, revealedLockedCount]
  );

  return {
    phoneUnlocked,
    revealedLockedCount,
    showPostReveal,
    beginStaggeredReveal,
    isLockedCardRevealed,
    revealAnchorRef,
    showTotalBanner: phoneUnlocked,
  };
}
