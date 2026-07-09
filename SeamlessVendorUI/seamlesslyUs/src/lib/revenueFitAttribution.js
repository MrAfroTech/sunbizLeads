import { getStoredLeadEmail } from './leadEngineStorage';
import {
  getStoredCalculatorVisitId,
  getStoredContactEmail,
} from './seamlesslyContactCapture';
import { parseContactFromSearchParams } from './journeyContactHelpers';

export const REVENUE_FIT_CALENDLY_URL =
  'https://calendly.com/staying-ahead-of-the-game/seamless-chat-clone';

export function buildCalendlyBookingUrl({ name, email, attribution = {} }) {
  const params = new URLSearchParams();
  if (name) params.set('name', String(name).trim());
  if (email) params.set('email', String(email).trim().toLowerCase());
  if (attribution.campaign) params.set('campaign', String(attribution.campaign));
  if (attribution.contactId) params.set('contactId', String(attribution.contactId));
  if (attribution.calculatorType) params.set('calculator', String(attribution.calculatorType));
  if (attribution.variant) params.set('variant', String(attribution.variant));
  const qs = params.toString();
  return `${REVENUE_FIT_CALENDLY_URL}${qs ? `?${qs}` : ''}`;
}

export function inferCalculatorType(pathname = '') {
  if (pathname.includes('/sports')) return 'sports';
  if (pathname.includes('/wait')) return 'wait';
  if (pathname.includes('/restaurants')) return 'restaurants';
  if (pathname.includes('/hotels')) return 'hotels';
  if (pathname.includes('/magic-bands')) return 'magic_bands';
  if (pathname.includes('/staffburnout')) return 'staff_burnout';
  if (pathname.includes('/districts')) return 'districts';
  if (pathname.includes('/events')) return 'events';
  return 'unknown';
}

export function buildAttributionFromLocation(searchParams, pathname = '') {
  const contact = parseContactFromSearchParams(searchParams);
  const email =
    contact.email ||
    getStoredLeadEmail() ||
    getStoredContactEmail() ||
    '';

  return {
    email: email || undefined,
    campaign:
      searchParams.get('campaign') ||
      searchParams.get('utm_campaign') ||
      searchParams.get('last_click_campaign') ||
      undefined,
    contactId:
      searchParams.get('contact_id') ||
      searchParams.get('contactId') ||
      getStoredCalculatorVisitId() ||
      undefined,
    calculatorType:
      searchParams.get('calculator') ||
      searchParams.get('calculator_type') ||
      inferCalculatorType(pathname),
    variant:
      searchParams.get('variant') ||
      searchParams.get('ab_variant') ||
      searchParams.get('ab') ||
      undefined,
  };
}

/** Resolve lead fields from URL, storage, and optional parent overrides — no form re-entry. */
export function resolveLeadContext(searchParams, pathname = '', overrides = {}) {
  const contact = parseContactFromSearchParams(searchParams);
  const attribution = buildAttributionFromLocation(searchParams, pathname);

  return {
    name: overrides.name || contact.fullName || undefined,
    email:
      overrides.email ||
      attribution.email ||
      contact.email ||
      undefined,
    phone: overrides.phone || contact.phone || undefined,
    attribution: {
      ...attribution,
      email:
        overrides.email ||
        attribution.email ||
        contact.email ||
        undefined,
      contactId: attribution.contactId || contact.contactId,
    },
  };
}
