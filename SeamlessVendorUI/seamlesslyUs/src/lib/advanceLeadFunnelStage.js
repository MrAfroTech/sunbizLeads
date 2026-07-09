import { supabase } from './supabaseClient';
import { normalizeLeadEmail } from './scanAndScaleClickEvent';

/**
 * Best-effort funnel_stage advance on the canonical v2 lead row (by email).
 */
export async function advanceLeadFunnelStage(email, nextStage) {
  if (!supabase || !email || !nextStage) return { ok: false };

  const normalizedEmail = normalizeLeadEmail(email);
  if (!normalizedEmail) return { ok: false };

  const { data: row, error: fetchError } = await supabase
    .from('scan_and_scale_click_events')
    .select('id, funnel_stage, engine_version')
    .eq('email', normalizedEmail)
    .eq('engine_version', 'v2')
    .maybeSingle();

  if (fetchError || !row?.id) {
    return { ok: false };
  }

  const { error: updateError } = await supabase
    .from('scan_and_scale_click_events')
    .update({
      funnel_stage: nextStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, lead_id: row.id };
}
