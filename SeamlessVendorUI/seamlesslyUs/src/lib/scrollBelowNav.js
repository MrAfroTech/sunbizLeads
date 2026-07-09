/** Fixed navbar height + small breathing room (see Navbar.css). */
export const CALCULATOR_NAV_SCROLL_OFFSET = 88;

/**
 * Scroll so `element` sits fully below the fixed nav blur bar.
 */
export function scrollElementBelowNav(element, offset = CALCULATOR_NAV_SCROLL_OFFSET) {
  if (!element || typeof window === 'undefined') return;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}
