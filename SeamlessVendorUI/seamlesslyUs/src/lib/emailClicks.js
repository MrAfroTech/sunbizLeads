import { supabase } from './supabaseClient';

const TABLE = 'brevo_contacts';

function normalizeEmail(raw) {
  try {
    return decodeURIComponent(String(raw).replace(/\+/g, ' ')).trim().toLowerCase();
  } catch {
    return String(raw).trim().toLowerCase();
  }
}

/**
 * Updates brevo_contacts with latest email landing (or inserts a minimal row if missing).
 * Expects URL params: ?contact=<email>&campaign=<name>
 */
export async function recordEmailCampaignLandingFromSearch(searchString) {
  if (!supabase || typeof window === 'undefined') return;

  const params = new URLSearchParams(searchString || '');
  const rawContact = params.get('contact');
  if (!rawContact) return;

  const email = normalizeEmail(rawContact);
  if (!email) return;

  const rawCampaign = params.get('campaign');
  const campaign =
    rawCampaign == null || String(rawCampaign).trim() === ''
      ? null
      : String(rawCampaign).trim();

  const path = `${window.location.pathname}${window.location.search || ''}`.slice(0, 2000);
  const now = new Date().toISOString();

  const payload = {
    last_click_path: path,
    last_click_campaign: campaign,
    last_click_at: now,
    updated_at: now,
  };

  const { data: updatedRows, error: updateErr } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('email', email)
    .select('email');

  if (!updateErr && updatedRows && updatedRows.length > 0) {
    return;
  }

  await supabase.from(TABLE).insert({
    email,
    ...payload,
  });
}
