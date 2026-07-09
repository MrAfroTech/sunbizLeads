/**
 * Lead/contact + venue-leak calculator inputs from URL query strings.
 * Contact: email, contact, name, firstName, lastName, phone, venueName, venue, company, contactId.
 * Calculator: persona, orderingMethod|ordering_method, peakNightCustomers|peak_night_customers,
 *   averageSpendPerCustomer|average_spend|avgSpend.
 */

import { ORDERING_OPTIONS, PERSONA_OPTIONS } from './calculatorLeadScore';
import { EVENT_ROLE_OPTIONS } from './eventCalculatorMath';
import { HANDOFF_QUALITY_OPTIONS } from './eventCalculatorMath';
import { HOTEL_ROLE_OPTIONS } from './hotelGuestSpendCalculatorMath';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Brevo, HubSpot, Mailchimp, etc. — literal merge tags must not prefill forms. */
const UNRESOLVED_MERGE_TAG_PATTERNS = [
  /\{\{[\s\S]*?\}\}/,
  /\*\|[^|]+\|\*/,
  /%\w+%/,
  /\[\[[\w.]+\]\]/,
  /^\{[A-Z0-9_]+\}$/,
];

export function isUnresolvedMergeTag(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return false;
  if (UNRESOLVED_MERGE_TAG_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  if (trimmed.includes('{{') || trimmed.includes('}}')) return true;
  if (trimmed.includes('*|') || trimmed.includes('|*')) return true;
  return false;
}

export function sanitizeContactFieldValue(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed || isUnresolvedMergeTag(trimmed)) return '';
  return trimmed;
}

function matchSelectOption(value, options) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (options.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return options.find((option) => option.toLowerCase() === lower) || '';
}

export function decodeQueryParam(raw) {
  if (raw == null || raw === '') return '';
  try {
    return decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim();
  } catch {
    return String(raw).trim();
  }
}

function resolveEmailFromSearchParams(searchParams) {
  const email = sanitizeContactFieldValue(decodeQueryParam(searchParams.get('email')));
  if (email && email.includes('@')) return email;
  const contact = sanitizeContactFieldValue(decodeQueryParam(searchParams.get('contact')));
  if (contact && contact.includes('@')) return contact;
  return '';
}

function resolveFullNameFromSearchParams(searchParams) {
  const name = sanitizeContactFieldValue(decodeQueryParam(searchParams.get('name')));
  if (name) return name;

  const firstName = sanitizeContactFieldValue(
    decodeQueryParam(searchParams.get('firstName')) ||
      decodeQueryParam(searchParams.get('first_name'))
  );
  const lastName = sanitizeContactFieldValue(
    decodeQueryParam(searchParams.get('lastName')) ||
      decodeQueryParam(searchParams.get('last_name'))
  );
  if (firstName && lastName) return `${firstName} ${lastName}`.trim();
  if (firstName) return firstName;
  if (lastName) return lastName;

  return '';
}

function resolveFirstNameFromSearchParams(searchParams) {
  const firstName = sanitizeContactFieldValue(
    decodeQueryParam(searchParams.get('firstName')) ||
      decodeQueryParam(searchParams.get('first_name'))
  );
  if (firstName) return firstName;

  const name = sanitizeContactFieldValue(decodeQueryParam(searchParams.get('name')));
  if (name) return name.split(/\s+/)[0] || '';

  return '';
}

function resolveLastNameFromSearchParams(searchParams) {
  const lastName = sanitizeContactFieldValue(
    decodeQueryParam(searchParams.get('lastName')) ||
      decodeQueryParam(searchParams.get('last_name'))
  );
  if (lastName) return lastName;

  const name = sanitizeContactFieldValue(decodeQueryParam(searchParams.get('name')));
  if (name) {
    const parts = name.split(/\s+/);
    if (parts.length > 1) return parts.slice(1).join(' ');
  }

  return '';
}

function resolveVenueNameFromSearchParams(searchParams) {
  return sanitizeContactFieldValue(
    decodeQueryParam(searchParams.get('venueName')) ||
      decodeQueryParam(searchParams.get('venue_name')) ||
      decodeQueryParam(searchParams.get('venue')) ||
      decodeQueryParam(searchParams.get('company')) ||
      decodeQueryParam(searchParams.get('organization')) ||
      ''
  );
}

export function parseContactFromSearchParams(searchParams) {
  const contactId = sanitizeContactFieldValue(decodeQueryParam(searchParams.get('contactId')));
  return {
    firstName: resolveFirstNameFromSearchParams(searchParams),
    lastName: resolveLastNameFromSearchParams(searchParams),
    fullName: resolveFullNameFromSearchParams(searchParams),
    email: resolveEmailFromSearchParams(searchParams),
    phone: sanitizeContactFieldValue(decodeQueryParam(searchParams.get('phone'))),
    venueName: resolveVenueNameFromSearchParams(searchParams),
    contactId: contactId || undefined,
  };
}

/** Venue-leak calculator inputs (persona, ordering, peak nights, avg spend). */
export function parseCalculatorInputsFromSearchParams(searchParams) {
  const persona = matchSelectOption(
    decodeQueryParam(searchParams.get('persona')),
    PERSONA_OPTIONS
  );
  const orderingMethod = matchSelectOption(
    decodeQueryParam(searchParams.get('orderingMethod')) ||
      decodeQueryParam(searchParams.get('ordering_method')),
    ORDERING_OPTIONS
  );
  const peakNightCustomers =
    decodeQueryParam(searchParams.get('peakNightCustomers')) ||
    decodeQueryParam(searchParams.get('peak_night_customers')) ||
    decodeQueryParam(searchParams.get('peakCustomers')) ||
    '';
  const averageSpendPerCustomer =
    decodeQueryParam(searchParams.get('averageSpendPerCustomer')) ||
    decodeQueryParam(searchParams.get('average_spend')) ||
    decodeQueryParam(searchParams.get('avgSpend')) ||
    '';

  return {
    persona,
    orderingMethod,
    peakNightCustomers,
    averageSpendPerCustomer,
  };
}

export function parseVenueLeakFormFromSearchParams(searchParams) {
  return {
    ...parseContactFromSearchParams(searchParams),
    ...parseCalculatorInputsFromSearchParams(searchParams),
  };
}

export function hasCalculatorInputsInUrl(searchParams) {
  const inputs = parseCalculatorInputsFromSearchParams(searchParams);
  const customers = parseFloat(inputs.peakNightCustomers);
  const spend = parseFloat(inputs.averageSpendPerCustomer);
  return Boolean(
    inputs.persona &&
      inputs.orderingMethod &&
      Number.isFinite(customers) &&
      customers > 0 &&
      Number.isFinite(spend) &&
      spend > 0
  );
}

export function parseEventCalculatorInputsFromSearchParams(searchParams) {
  const plannerType =
    matchSelectOption(decodeQueryParam(searchParams.get('plannerType')), EVENT_ROLE_OPTIONS) ||
    matchSelectOption(decodeQueryParam(searchParams.get('role')), EVENT_ROLE_OPTIONS) ||
    matchSelectOption(decodeQueryParam(searchParams.get('persona')), EVENT_ROLE_OPTIONS);
  const handoffQuality =
    matchSelectOption(decodeQueryParam(searchParams.get('handoffQuality')), HANDOFF_QUALITY_OPTIONS) ||
    matchSelectOption(decodeQueryParam(searchParams.get('orderingMethod')), HANDOFF_QUALITY_OPTIONS) ||
    matchSelectOption(decodeQueryParam(searchParams.get('ordering_method')), HANDOFF_QUALITY_OPTIONS);
  const eventsPerYear =
    decodeQueryParam(searchParams.get('eventsPerYear')) ||
    decodeQueryParam(searchParams.get('attendance')) ||
    decodeQueryParam(searchParams.get('peakNightCustomers')) ||
    decodeQueryParam(searchParams.get('peak_night_customers')) ||
    '';
  const avgEventFee =
    decodeQueryParam(searchParams.get('avgEventFee')) ||
    decodeQueryParam(searchParams.get('ticketPrice')) ||
    decodeQueryParam(searchParams.get('averageSpendPerCustomer')) ||
    decodeQueryParam(searchParams.get('average_spend')) ||
    '';

  return {
    plannerType,
    handoffQuality,
    eventsPerYear,
    avgEventFee,
    role: plannerType,
    ticketPrice: avgEventFee,
    attendance: eventsPerYear,
  };
}

export function hasEventCalculatorInputsInUrl(searchParams) {
  const inputs = parseEventCalculatorInputsFromSearchParams(searchParams);
  const events = parseFloat(inputs.eventsPerYear);
  const fee = parseFloat(inputs.avgEventFee);
  return Boolean(
    inputs.plannerType &&
      inputs.handoffQuality &&
      Number.isFinite(events) &&
      events > 0 &&
      Number.isFinite(fee) &&
      fee > 0
  );
}

export function parseHotelCalculatorInputsFromSearchParams(searchParams) {
  const role =
    matchSelectOption(decodeQueryParam(searchParams.get('role')), HOTEL_ROLE_OPTIONS) ||
    matchSelectOption(decodeQueryParam(searchParams.get('persona')), HOTEL_ROLE_OPTIONS);
  const nightlyRate =
    decodeQueryParam(searchParams.get('nightlyRate')) ||
    decodeQueryParam(searchParams.get('averageSpendPerCustomer')) ||
    decodeQueryParam(searchParams.get('average_spend')) ||
    '';
  const guestsPerNight =
    decodeQueryParam(searchParams.get('guestsPerNight')) ||
    decodeQueryParam(searchParams.get('peakNightCustomers')) ||
    decodeQueryParam(searchParams.get('peak_night_customers')) ||
    '';

  return { role, nightlyRate, guestsPerNight };
}

export function hasHotelCalculatorInputsInUrl(searchParams) {
  const inputs = parseHotelCalculatorInputsFromSearchParams(searchParams);
  const rate = parseFloat(inputs.nightlyRate);
  const guests = parseFloat(inputs.guestsPerNight);
  return Boolean(
    inputs.role &&
      Number.isFinite(rate) &&
      rate > 0 &&
      Number.isFinite(guests) &&
      guests > 0
  );
}

/** Contact + calculator fields for calculator_engagement_events (tracker + edge function). */
export function contactForEngagementTracker(source) {
  const parsed = source?.get ? parseVenueLeakFormFromSearchParams(source) : source;
  if (!parsed) return {};

  const firstName = (parsed.firstName || '').trim();
  const lastName = (parsed.lastName || '').trim();
  const fullName =
    (parsed.fullName || '').trim() || [firstName, lastName].filter(Boolean).join(' ');
  const email = (parsed.email || '').trim().toLowerCase();
  const phone = (parsed.phone || '').trim();
  const persona = (parsed.persona || '').trim();
  const orderingMethod = (parsed.orderingMethod || '').trim();
  const peakNightCustomers = (parsed.peakNightCustomers || '').trim();
  const averageSpendPerCustomer = (parsed.averageSpendPerCustomer || '').trim();

  const payload = {};
  if (firstName) payload.first_name = firstName;
  if (lastName) payload.last_name = lastName;
  if (fullName) payload.name = fullName;
  if (email) payload.email = email;
  if (phone) {
    payload.phone = phone;
    payload.phone_number = phone;
  }
  const venueName = (parsed.venueName || '').trim();
  if (venueName) payload.venue_name = venueName;
  if (persona) payload.persona = persona;
  if (orderingMethod) payload.ordering_method = orderingMethod;
  if (peakNightCustomers) payload.peak_night_customers = peakNightCustomers;
  if (averageSpendPerCustomer) payload.average_spend_per_customer = averageSpendPerCustomer;

  return payload;
}

/** Parse contact from the current page URL (calculator-tracker / SPA routes). */
export function parseContactFromUrl() {
  if (typeof window === 'undefined' || !window.location?.search) return {};
  return contactForEngagementTracker(new URLSearchParams(window.location.search));
}

/** True when a usable email is present in the query string (hides the inline contact form). */
export function hasLeadEmailInUrl(searchParams) {
  return EMAIL_RE.test(resolveEmailFromSearchParams(searchParams));
}

export function isContactComplete(contact) {
  if (!contact) return false;
  const nameOk = (contact.fullName || '').trim().length > 0;
  const emailOk = EMAIL_RE.test((contact.email || '').trim());
  const phoneOk = (contact.phone || '').replace(/\D/g, '').length >= 7;
  return nameOk && emailOk && phoneOk;
}

/** Preserve contact + Brevo ids when navigating between calculator routes. */
export function appendContactToSearchParams(qs, contact) {
  if (!qs || !contact) return qs;

  const email = (contact.email || '').trim();
  const firstName = (contact.firstName || '').trim();
  const fullName = (contact.fullName || '').trim();
  const phone = (contact.phone || '').trim();
  const venueName = (contact.venueName || '').trim();
  const contactId = (contact.contactId || '').trim();

  if (email) {
    qs.set('email', email);
  }
  if (firstName) {
    qs.set('firstName', firstName);
  }
  if (fullName) {
    qs.set('name', fullName);
  }
  if (phone) {
    qs.set('phone', phone);
  }
  if (venueName) {
    qs.set('venueName', venueName);
  }
  if (contactId) {
    qs.set('contactId', contactId);
  }

  return qs;
}

/** Preserve venue-leak calculator inputs when building campaign / return links. */
export function appendCalculatorInputsToSearchParams(qs, inputs) {
  if (!qs || !inputs) return qs;

  const persona = (inputs.persona || '').trim();
  const orderingMethod = (inputs.orderingMethod || '').trim();
  const peakNightCustomers = (inputs.peakNightCustomers || '').trim();
  const averageSpendPerCustomer = (inputs.averageSpendPerCustomer || '').trim();

  if (persona) qs.set('persona', persona);
  if (orderingMethod) qs.set('orderingMethod', orderingMethod);
  if (peakNightCustomers) qs.set('peakNightCustomers', peakNightCustomers);
  if (averageSpendPerCustomer) qs.set('averageSpendPerCustomer', averageSpendPerCustomer);

  return qs;
}

export function appendVenueLeakFormToSearchParams(qs, form) {
  if (!qs || !form) return qs;
  appendContactToSearchParams(qs, form);
  appendCalculatorInputsToSearchParams(qs, form);
  return qs;
}

/** Map UI state to Supabase column names */
export function contactForSupabase(contact) {
  if (!contact) return {};
  return {
    full_name: (contact.fullName || '').trim() || null,
    email: (contact.email || '').trim() || null,
    phone: (contact.phone || '').trim() || null,
  };
}
