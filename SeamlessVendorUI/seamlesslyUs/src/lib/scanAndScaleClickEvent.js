import { supabase } from './supabaseClient';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeLeadEmail(raw) {
  try {
    return decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim().toLowerCase();
  } catch {
    return String(raw).trim().toLowerCase();
  }
}

function defaultPagePath() {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search || ''}`.slice(0, 2000);
}

/**
 * Upsert into scan_and_scale_click_events (canonical lead table).
 * New inserts use engine_version v2 for the unified lead engine.
 * @returns {Promise<{ ok: boolean, inserted: boolean, lead_id?: string, error?: string }>}
 */
export async function recordScanAndScaleLeadCapture({
  email,
  name,
  phone,
  campaign,
  pagePath,
  source,
  calculatorEmailFields,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
}) {
  if (!supabase) {
    // eslint-disable-next-line no-console
    console.error(
      '[scan-scale funnel] Supabase not configured. Set REACT_APP_SUPABASE_URL_SALES_MASTERY and REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY.'
    );
    return { ok: false, inserted: false, error: 'not_configured' };
  }

  const normalizedEmail = normalizeLeadEmail(email);
  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return { ok: false, inserted: false, error: 'invalid_email' };
  }

  const phoneStr = String(phone || '').trim().slice(0, 50);

  const nameVal =
    name == null || String(name).trim() === '' ? null : String(name).trim().slice(0, 500);
  const now = new Date().toISOString();
  const path = (pagePath || defaultPagePath()).slice(0, 2000);
  const campaignVal =
    campaign == null || String(campaign).trim() === ''
      ? null
      : String(campaign).trim().slice(0, 500);
  const sourceVal =
    source == null || String(source).trim() === ''
      ? null
      : String(source).trim().slice(0, 200);

  const payload = {
    name: nameVal,
    phone: phoneStr || null,
    last_click_path: path,
    last_click_campaign: campaignVal,
    last_click_at: now,
    updated_at: now,
  };

  if (sourceVal) {
    payload.lead_source = sourceVal;
  }

  if (calculatorEmailFields && typeof calculatorEmailFields === 'object') {
    const loss = String(calculatorEmailFields.estimated_loss || '').trim();
    const wait = String(calculatorEmailFields.avg_wait_time || '').trim();
    const zone = String(calculatorEmailFields.primary_friction_zone || '').trim();
    if (loss) payload.estimated_loss = loss.slice(0, 100);
    if (wait) payload.avg_wait_time = wait.slice(0, 100);
    if (zone) payload.primary_friction_zone = zone.slice(0, 500);
  }

  const variantVal =
    abVariant === 'a' || abVariant === 'b' ? abVariant : null;
  if (variantVal) payload.ab_variant = variantVal;
  if (persona) payload.persona = String(persona).trim().slice(0, 100);
  if (orderingMethod) payload.ordering_method = String(orderingMethod).trim().slice(0, 100);
  if (leadScore != null && Number.isFinite(leadScore)) {
    payload.lead_score = Math.round(leadScore);
  }

  const { data: existingRow } = await supabase
    .from('scan_and_scale_click_events')
    .select('engine_version, emails_sent')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingRow?.engine_version === 'v2_abandon') {
    payload.engine_version = 'v2';
    payload.funnel_stage = 'abandon_exited';
    payload.emails_sent = 0;
  } else if (!existingRow) {
    payload.engine_version = 'v2';
  } else if (existingRow.engine_version === 'v2') {
    payload.engine_version = 'v2';
  } else {
    payload.engine_version = 'v2';
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from('scan_and_scale_click_events')
    .update(payload)
    .eq('email', normalizedEmail)
    .select('id');

  if (updateError) {
    // eslint-disable-next-line no-console
    console.error('[scan-scale funnel] update failed:', updateError.message);
    return { ok: false, inserted: false, error: updateError.message };
  }

  if (updatedRows && updatedRows.length > 0) {
    return {
      ok: true,
      inserted: false,
      lead_id: updatedRows[0]?.id ? String(updatedRows[0].id) : undefined,
    };
  }

  const { data: insertedRow, error: insertError } = await supabase
    .from('scan_and_scale_click_events')
    .insert({
      email: normalizedEmail,
      engine_version: 'v2',
      ...payload,
    })
    .select('id')
    .single();

  if (insertError) {
    // eslint-disable-next-line no-console
    console.error('[scan-scale funnel] insert failed:', insertError.message);
    return { ok: false, inserted: false, error: insertError.message };
  }

  return {
    ok: true,
    inserted: true,
    lead_id: insertedRow?.id ? String(insertedRow.id) : undefined,
  };
}
