import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

export type LeadIdentity = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
};

export type LeadAttribution = {
  ab_variant?: string | null;
  persona?: string | null;
  ordering_method?: string | null;
  lead_score?: number | null;
};

export function coerceText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function coerceEmail(value: unknown): string | null {
  const text = coerceText(value);
  return text ? text.toLowerCase() : null;
}

export function coerceVariant(value: unknown): string | null {
  const text = coerceText(value)?.toLowerCase();
  return text === 'a' || text === 'b' ? text : null;
}

export function coerceLeadScore(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

/** Extract identity + attribution from ingest payload body and meta. */
export function parseIdentityAttribution(
  body: Record<string, unknown>,
  meta: Record<string, unknown>,
): LeadIdentity & LeadAttribution {
  const email =
    coerceEmail(body.email) ??
    coerceEmail(meta.email) ??
    coerceEmail(meta.contact);

  const name =
    coerceText(body.name) ??
    coerceText(meta.name) ??
    ([coerceText(meta.first_name), coerceText(meta.last_name)]
      .filter(Boolean)
      .join(' ') || null);

  const phone =
    coerceText(body.phone) ??
    coerceText(meta.phone) ??
    coerceText(meta.phone_number);

  return {
    email,
    name: name || null,
    phone,
    ab_variant: coerceVariant(body.ab_variant) ?? coerceVariant(meta.ab_variant),
    persona: coerceText(body.persona) ?? coerceText(meta.persona),
    ordering_method:
      coerceText(body.ordering_method) ?? coerceText(meta.ordering_method),
    lead_score: coerceLeadScore(body.lead_score) ?? coerceLeadScore(meta.lead_score),
  };
}

function buildIdentityPatch(identity: LeadIdentity): Record<string, string> {
  const patch: Record<string, string> = {};
  const email = coerceEmail(identity.email);
  const name = coerceText(identity.name);
  const phone = coerceText(identity.phone);
  if (email) patch.email = email;
  if (name) patch.name = name.slice(0, 500);
  if (phone) patch.phone = phone.slice(0, 50);
  return patch;
}

function buildAttributionPatch(attribution: LeadAttribution): Record<string, string | number> {
  const patch: Record<string, string | number> = {};
  const variant = coerceVariant(attribution.ab_variant);
  const persona = coerceText(attribution.persona);
  const orderingMethod = coerceText(attribution.ordering_method);
  const score = coerceLeadScore(attribution.lead_score);
  if (variant) patch.ab_variant = variant;
  if (persona) patch.persona = persona.slice(0, 100);
  if (orderingMethod) patch.ordering_method = orderingMethod.slice(0, 100);
  if (score != null) patch.lead_score = score;
  return patch;
}

/**
 * Backfill identity + attribution onto calculator_page_visits when identity becomes known.
 * Prefers visitId; falls back to the latest row for the email with ab_variant set.
 */
export async function propagateIdentityToCalculatorVisits(
  admin: SupabaseClient,
  options: { visitId?: string | null; email?: string | null },
  identity: LeadIdentity,
  attribution: LeadAttribution = {},
): Promise<void> {
  const patch = {
    ...buildIdentityPatch(identity),
    ...buildAttributionPatch(attribution),
  };
  if (!Object.keys(patch).length) return;

  const visitId = coerceText(options.visitId);
  if (visitId) {
    const { error } = await admin
      .from('calculator_page_visits')
      .update(patch)
      .eq('id', visitId);
    if (error) {
      console.warn('[lead-identity] calculator_page_visits visitId backfill failed:', error.message);
    }
    return;
  }

  const email = coerceEmail(options.email) ?? coerceEmail(identity.email);
  if (!email) return;

  const { data: rows, error: fetchErr } = await admin
    .from('calculator_page_visits')
    .select('id')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.warn('[lead-identity] calculator_page_visits lookup failed:', fetchErr.message);
    return;
  }

  let targetId = rows?.[0]?.id ? String(rows[0].id) : null;

  if (!targetId) {
    const { data: metaRows } = await admin
      .from('lead_events')
      .select('meta')
      .eq('email', email)
      .not('meta', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    for (const row of metaRows ?? []) {
      const meta = row.meta as Record<string, unknown> | null;
      const fromMeta =
        coerceText(meta?.visit_id) ?? coerceText(meta?.calculator_visit_id);
      if (fromMeta) {
        targetId = fromMeta;
        break;
      }
    }
  }

  if (!targetId) return;

  const { error } = await admin
    .from('calculator_page_visits')
    .update(patch)
    .eq('id', targetId);

  if (error) {
    console.warn('[lead-identity] calculator_page_visits email backfill failed:', error.message);
  }
}

/** Merge identity onto the canonical lead row when attribution is known. */
export async function propagateAttributionToLeadRow(
  admin: SupabaseClient,
  leadId: string,
  attribution: LeadAttribution,
  identity: LeadIdentity = {},
): Promise<void> {
  const patch = {
    ...buildIdentityPatch(identity),
    ...buildAttributionPatch(attribution),
    updated_at: new Date().toISOString(),
  };
  if (Object.keys(patch).length <= 1) return;

  const { error } = await admin
    .from('scan_and_scale_click_events')
    .update(patch)
    .eq('id', leadId);

  if (error) {
    console.warn('[lead-identity] scan_and_scale_click_events attribution failed:', error.message);
  }
}
