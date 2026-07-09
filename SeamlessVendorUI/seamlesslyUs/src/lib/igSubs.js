import { supabase } from './supabaseClient';
import { normalizeLeadEmail } from './scanAndScaleClickEvent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function defaultPagePath() {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search || ''}`.slice(0, 2000);
}

/**
 * Insert or update a row in ig_subs (one row per email — same upsert pattern as scan_and_scale_click_events).
 * @returns {Promise<{ ok: boolean, id?: string, duplicate?: boolean, error?: string }>}
 */
export async function submitIgSub({ firstName, email, phone, metadata }) {
  if (!supabase) {
    // eslint-disable-next-line no-console
    console.error(
      '[ig_subs] Supabase not configured. Set REACT_APP_SUPABASE_URL_SALES_MASTERY and REACT_APP_SUPABASE_ANON_KEY_SALES_MASTERY.'
    );
    return { ok: false, error: 'not_configured' };
  }

  const trimmedFirstName = String(firstName || '').trim();
  if (!trimmedFirstName) {
    return { ok: false, error: 'missing_first_name' };
  }

  const normalizedEmail = normalizeLeadEmail(email);
  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return { ok: false, error: 'invalid_email' };
  }

  const phoneVal = phone == null || String(phone).trim() === '' ? null : String(phone).trim().slice(0, 50);

  const payload = {
    first_name: trimmedFirstName.slice(0, 200),
    email: normalizedEmail,
    phone: phoneVal,
    source: 'instagram',
    metadata: {
      page_path: defaultPagePath(),
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
    },
  };

  const { data: updatedRows, error: updateError } = await supabase
    .from('ig_subs')
    .update(payload)
    .eq('email', normalizedEmail)
    .select('id');

  if (updateError) {
    // eslint-disable-next-line no-console
    console.error('[ig_subs] update failed:', updateError.message);
    return { ok: false, error: updateError.message };
  }

  if (updatedRows && updatedRows.length > 0) {
    return {
      ok: true,
      id: updatedRows[0]?.id ? String(updatedRows[0].id) : undefined,
      duplicate: true,
    };
  }

  const { data: insertedRow, error: insertError } = await supabase
    .from('ig_subs')
    .insert(payload)
    .select('id')
    .single();

  if (insertError) {
    // eslint-disable-next-line no-console
    console.error('[ig_subs] insert failed:', insertError.message);
    return { ok: false, error: insertError.message };
  }

  return {
    ok: true,
    id: insertedRow?.id ? String(insertedRow.id) : undefined,
    duplicate: false,
  };
}
