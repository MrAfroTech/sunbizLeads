import { getOrCreateSessionId } from './leadEngineStorage';

/**
 * POST to unified lead_events ingest (proxied via /api/ingest-lead-event).
 */
export async function ingestLeadEvent({
  eventName,
  engagementType = 'interact',
  source,
  email,
  name,
  phone,
  visitId,
  abVariant,
  persona,
  orderingMethod,
  leadScore,
  meta = {},
}) {
  if (!eventName || !source) return { ok: false };

  const mergedMeta = {
    ...meta,
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(visitId ? { visit_id: visitId } : {}),
    ...(abVariant ? { ab_variant: abVariant } : {}),
    ...(persona ? { persona } : {}),
    ...(orderingMethod ? { ordering_method: orderingMethod } : {}),
    ...(leadScore != null && Number.isFinite(leadScore) ? { lead_score: leadScore } : {}),
  };

  try {
    const res = await fetch('/api/ingest-lead-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        engagement_type: engagementType,
        source,
        email: email || undefined,
        name: name || undefined,
        phone: phone || undefined,
        visit_id: visitId || undefined,
        ab_variant: abVariant || undefined,
        persona: persona || undefined,
        ordering_method: orderingMethod || undefined,
        lead_score:
          leadScore != null && Number.isFinite(leadScore) ? Math.round(leadScore) : undefined,
        session_id: getOrCreateSessionId(),
        meta: mergedMeta,
      }),
      keepalive: true,
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, ...body };
  } catch {
    return { ok: false };
  }
}
