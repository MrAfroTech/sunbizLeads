import { supabase } from './supabaseClient';
import { normalizeVariant } from './calculatorAbTest';
import {
  getStoredCalculatorVisitId,
  getStoredContactEmail,
  persistCalculatorVisitId,
} from './seamlesslyContactCapture';
import { mergeStoredIdentity, resolveKnownLeadIdentity } from './leadIdentity';
import { isUnresolvedMergeTag, sanitizeContactFieldValue } from './journeyContactHelpers';

const PLACEHOLDER_VISIT_ID = '<uuid>';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TEST_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'team.us',
  'team.com',
  'test.com',
]);

function resolveVisitRecordId(id) {
  const trimmed = String(id ?? '').trim();
  if (!trimmed || trimmed === PLACEHOLDER_VISIT_ID) return null;
  if (!UUID_RE.test(trimmed)) return null;
  return trimmed;
}

function isJunkEmail(email) {
  if (!email) return false;
  const lower = String(email).trim().toLowerCase();
  if (isUnresolvedMergeTag(lower)) return true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) return true;
  const domain = lower.split('@')[1] || '';
  if (TEST_DOMAINS.has(domain) || domain.includes('seamlessly')) return true;
  if (lower.includes('test') || lower.includes('user')) return true;
  if (lower === 'maurice@mauricethefirst.com') return true;
  return false;
}

function contactFromQueryParams(queryParams) {
  if (!queryParams || typeof queryParams !== 'object') {
    return { email: null, name: null, phone: null };
  }

  const rawEmail = sanitizeContactFieldValue(queryParams.email);
  const email = rawEmail && rawEmail.includes('@') ? rawEmail.toLowerCase() : null;
  if (email && isJunkEmail(email)) {
    return { email: null, name: null, phone: null, quarantined: true, quarantineEmail: email };
  }

  const firstName = sanitizeContactFieldValue(queryParams.firstName);
  const lastName = sanitizeContactFieldValue(queryParams.lastName);
  const name = [firstName, lastName].filter(Boolean).join(' ') || null;

  const phoneRaw = sanitizeContactFieldValue(queryParams.phone);
  const phone = phoneRaw ? phoneRaw.slice(0, 50) : null;

  return { email, name, phone };
}

/** Must match rows you filter on in Supabase. */
export const CALCULATOR_PAGE_KEYS = {
  SPORTS_CALCULATOR: 'sports_calculator',
  SPORTS2_CALCULATOR: 'sports2_calculator',
  SPORTS3_CALCULATOR: 'sports3_calculator',
  SPORTS_RESULTS: 'sports_results',
  SPORTS_TURNOVER_RESULTS: 'sports_turnover_results',
  STAFF_TURNOVER_CALCULATOR: 'staff_turnover_calculator',
  STAFF_BURNOUT_RESULTS: 'staff_burnout_results',
  MAGIC_BANDS_CALCULATOR: 'magic_bands_calculator',
  MAGIC_BANDS_RESULTS: 'magic_bands_results',
  WAIT_CALCULATOR: 'wait_calculator',
  RESTAURANTS_CALCULATOR: 'restaurants_calculator',
  RESTAURANTS2_CALCULATOR: 'restaurants2_calculator',
  RESTAURANTS3_CALCULATOR: 'restaurants3_calculator',
  HOTELS_CALCULATOR: 'hotels_calculator',
  HOTELS2_CALCULATOR: 'hotels2_calculator',
  HOTELS3_CALCULATOR: 'hotels3_calculator',
  EVENTS_CALCULATOR: 'events_calculator',
  EVENTS2_CALCULATOR: 'events2_calculator',
  EVENTS3_CALCULATOR: 'events3_calculator',
  DISTRICTS_CALCULATOR: 'districts_calculator',
  DISTRICTS2_CALCULATOR: 'districts2_calculator',
  DISTRICTS3_CALCULATOR: 'districts3_calculator',
  FESTIVALS_CALCULATOR: 'festivals_calculator',
  FESTIVALS2_CALCULATOR: 'festivals2_calculator',
  FESTIVALS3_CALCULATOR: 'festivals3_calculator',
};

/**
 * Inserts one row per page view. Does not touch journey / funnel tables.
 * @returns {Promise<string|null>} inserted row id, or null if skipped / failed
 */
export async function recordCalculatorPageVisit({
  pageKey,
  searchParams,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
}) {
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[calculator visits] Supabase not configured; skip visit log');
    }
    return null;
  }

  let path = null;
  let referrer = null;
  if (typeof window !== 'undefined') {
    path = `${window.location.pathname}${window.location.search || ''}`.slice(0, 2000);
  }
  if (typeof document !== 'undefined' && document.referrer) {
    referrer = document.referrer.slice(0, 500);
  }

  let queryParams = null;
  if (searchParams && typeof searchParams.entries === 'function') {
    try {
      queryParams = Object.fromEntries(searchParams.entries());
    } catch {
      queryParams = null;
    }
  }

  const urlContact = contactFromQueryParams(queryParams);
  const knownIdentity = resolveKnownLeadIdentity(searchParams);
  const variantFromUrl = normalizeVariant(queryParams?.variant);
  const resolvedVariant = normalizeVariant(abVariant) || variantFromUrl;

  let email = urlContact.email || knownIdentity.email || null;
  let name = urlContact.name || knownIdentity.name || null;
  let phone = urlContact.phone || knownIdentity.phone || knownIdentity.phone_number || null;

  // Leak 2: never write junk emails into calculator_page_visits
  if (email && isJunkEmail(email)) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[calculator visits] quarantined junk email, skipping identity fields');
    }
    email = null;
    name = null;
    phone = null;
  }

  const visitId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : null;

  const row = {
    page_key: pageKey,
    path,
    query_params: queryParams && Object.keys(queryParams).length ? queryParams : null,
    referrer,
    email,
    name,
    phone,
  };

  if (resolvedVariant) row.ab_variant = resolvedVariant;
  if (persona) row.persona = persona;
  if (orderingMethod) row.ordering_method = orderingMethod;
  if (leadScore != null && Number.isFinite(leadScore)) row.lead_score = Math.round(leadScore);

  if (visitId) {
    row.id = visitId;
  }

  const { data, error } = await supabase
    .from('calculator_page_visits')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[calculator visits] insert failed:', error.message);
    return null;
  }

  const resolvedId = data?.id ?? visitId ?? null;
  if (resolvedId) persistCalculatorVisitId(resolvedId);
  return resolvedId;
}

function buildVisitSyncPatch({
  name,
  email,
  phone,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
}) {
  const identity = mergeStoredIdentity({ name, email, phone });
  const patch = {};

  const nameVal =
    identity.name == null || String(identity.name).trim() === ''
      ? null
      : String(identity.name).trim().slice(0, 500);
  const emailVal =
    identity.email == null || String(identity.email).trim() === ''
      ? null
      : String(identity.email).trim().toLowerCase();
  const phoneVal =
    identity.phone == null || String(identity.phone).trim() === ''
      ? null
      : String(identity.phone).trim().slice(0, 50);

  if (nameVal) patch.name = nameVal;
  if (emailVal) patch.email = emailVal;
  if (phoneVal) patch.phone = phoneVal;

  const variantVal = normalizeVariant(abVariant);
  if (variantVal) patch.ab_variant = variantVal;
  if (persona) patch.persona = String(persona).trim().slice(0, 100);
  if (orderingMethod) patch.ordering_method = String(orderingMethod).trim().slice(0, 100);
  if (leadScore != null && Number.isFinite(leadScore)) {
    patch.lead_score = Math.round(leadScore);
  }

  return patch;
}

/**
 * Unified write: identity + A/B attribution on the same calculator_page_visits row.
 * Standing rule for the lead system — always sync both when either is known.
 */
export async function syncCalculatorPageVisit({
  id,
  name,
  email,
  phone,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
}) {
  if (!supabase) return { ok: false };

  const visitRecordId = resolveVisitRecordId(id);
  if (!visitRecordId) return { ok: false, error: 'invalid_visit_id' };

  const patch = buildVisitSyncPatch({
    name,
    email,
    phone,
    abVariant,
    persona,
    orderingMethod,
    leadScore,
  });

  if (!Object.keys(patch).length) return { ok: true };

  const { error } = await supabase
    .from('calculator_page_visits')
    .update(patch)
    .eq('id', visitRecordId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[calculator visits] sync failed:', error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Persists A/B attribution, qualification fields, and lead score on a visit row.
 * Pass name/email/phone when known so identity and attribution stay on one row.
 */
export async function updateCalculatorPageVisitAttribution({
  id,
  name,
  email,
  phone,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
}) {
  return syncCalculatorPageVisit({
    id,
    name,
    email,
    phone,
    abVariant,
    persona,
    orderingMethod,
    leadScore,
  });
}

/**
 * After gate submit — identity + attribution on the same visit row.
 */
export async function syncVisitAfterContactSubmit({
  id,
  contact,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
}) {
  const name =
    contact?.firstName ||
    contact?.fullName ||
    contact?.name ||
    undefined;
  return updateCalculatorPageVisitAttribution({
    id,
    name,
    email: contact?.email,
    phone: contact?.phone,
    abVariant,
    persona,
    orderingMethod,
    leadScore,
  });
}

/**
 * Sets reached_checkout on an existing calculator_page_visits row (no insert).
 */
export async function markCalculatorVisitReachedCheckout({ id, email } = {}) {
  if (!supabase) {
    return { ok: false, error: 'not_configured' };
  }

  let visitRecordId = resolveVisitRecordId(id) || getStoredCalculatorVisitId();

  const emailVal =
    email == null || String(email).trim() === ''
      ? getStoredContactEmail()
      : String(email).trim().toLowerCase();

  if (!visitRecordId && emailVal) {
    const { data: row, error: fetchError } = await supabase
      .from('calculator_page_visits')
      .select('id')
      .eq('email', emailVal)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error('[calculator visits] reached_checkout lookup failed:', fetchError.message);
      return { ok: false, error: fetchError.message };
    }
    visitRecordId = row?.id ? String(row.id) : null;
  }

  if (!visitRecordId) {
    return { ok: false, error: 'visit_not_found' };
  }

  const { error } = await supabase
    .from('calculator_page_visits')
    .update({ reached_checkout: true })
    .eq('id', visitRecordId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[calculator visits] reached_checkout update failed:', error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: visitRecordId };
}

/**
 * Updates contact fields on an existing calculator_page_visits row.
 * @returns {Promise<{ ok: boolean }>}
 */
export async function updateCalculatorPageVisitContact({
  id,
  name,
  email,
  phone,
  lastClickCampaign,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
}) {
  if (!supabase) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[calculator visits] Supabase not configured; skip contact update');
    }
    return { ok: false };
  }

  const visitRecordId = resolveVisitRecordId(id);
  if (!visitRecordId) {
    return { ok: false, error: 'invalid_visit_id' };
  }

  const result = await syncCalculatorPageVisit({
    id: visitRecordId,
    name,
    email,
    phone,
    abVariant,
    persona,
    orderingMethod,
    leadScore,
  });

  if (!result.ok) return result;

  if (lastClickCampaign) {
    const campaignVal = String(lastClickCampaign).trim().slice(0, 500);
    const { error } = await supabase
      .from('calculator_page_visits')
      .update({ last_click_campaign: campaignVal })
      .eq('id', visitRecordId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[calculator visits] campaign update failed:', error.message);
      return { ok: false };
    }
  }

  return { ok: true };
}
