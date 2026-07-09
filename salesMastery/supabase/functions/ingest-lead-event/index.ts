import { calculatorOutputFromMeta } from '../_shared/lead-calculator-fields.ts';
import {
  coerceEmail,
  coerceText,
  parseIdentityAttribution,
  propagateAttributionToLeadRow,
  propagateIdentityToCalculatorVisits,
} from '../_shared/lead-identity.ts';
import {
  logIngestionReject,
  quarantineReasonForEmail,
} from '../_shared/lead-ingestion-guard.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

const corsHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-max-age': '86400',
};

const ENGAGEMENT_TYPES = new Set(['view', 'interact', 'submit', 'repeat', 'phone_provided']);

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const eventName = coerceText(body.event_name);
    const engagementType = coerceText(body.engagement_type);
    const source = coerceText(body.source);

    if (!eventName || !engagementType || !source) {
      return new Response(
        JSON.stringify({ error: 'event_name, engagement_type, and source are required' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    if (!ENGAGEMENT_TYPES.has(engagementType)) {
      return new Response(
        JSON.stringify({ error: 'invalid engagement_type' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    const sessionId = coerceText(body.session_id);
    const meta = typeof body.meta === 'object' && body.meta !== null
      ? body.meta as Record<string, unknown>
      : {};
    const parsed = parseIdentityAttribution(body, meta);
    let email = parsed.email;

    const visitId =
      coerceText(body.visit_id) ??
      coerceText(meta.visit_id) ??
      coerceText(meta.calculator_visit_id);

    const admin = createAdminClient();

    // Leak 1: if email missing but visit_id known, pull identity from CPV at insert time
    if (!email && visitId) {
      const { data: visit } = await admin
        .from('calculator_page_visits')
        .select('email, name, phone')
        .eq('id', visitId)
        .maybeSingle();
      if (visit?.email) {
        email = coerceEmail(visit.email);
        if (!parsed.name && visit.name) parsed.name = coerceText(visit.name);
        if (!parsed.phone && visit.phone) parsed.phone = coerceText(visit.phone);
      }
    }

    // Leak 2: quarantine junk emails — do not insert into lead_events
    const rejectReason = quarantineReasonForEmail(email);
    if (rejectReason) {
      await logIngestionReject(admin, {
        email,
        sourceTable: 'lead_events',
        reason: rejectReason,
        payload: { event_name: eventName, source, session_id: sessionId, visit_id: visitId },
      });
      return new Response(
        JSON.stringify({ success: false, quarantined: true, reason: rejectReason }),
        { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    let leadId: string | null = null;

    if (email) {
      const { data: leadRow } = await admin
        .from('scan_and_scale_click_events')
        .select('id, event_count')
        .eq('email', email)
        .maybeSingle();

      if (leadRow?.id) {
        leadId = String(leadRow.id);
        const nextCount = (typeof leadRow.event_count === 'number' ? leadRow.event_count : 0) + 1;
        await admin
          .from('scan_and_scale_click_events')
          .update({
            last_event_at: new Date().toISOString(),
            event_count: nextCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId);
      }
    }

    const { data: inserted, error: insertErr } = await admin
      .from('lead_events')
      .insert({
        email,
        name: parsed.name,
        phone: parsed.phone,
        ab_variant: parsed.ab_variant,
        persona: parsed.persona,
        ordering_method: parsed.ordering_method,
        lead_score: parsed.lead_score,
        lead_id: leadId,
        event_name: eventName,
        engagement_type: engagementType,
        source,
        session_id: sessionId,
        meta,
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    if (email || visitId) {
      await propagateIdentityToCalculatorVisits(
        admin,
        { visitId, email },
        { email, name: parsed.name, phone: parsed.phone },
        {
          ab_variant: parsed.ab_variant,
          persona: parsed.persona,
          ordering_method: parsed.ordering_method,
          lead_score: parsed.lead_score,
        },
      );
    }

    if (leadId) {
      await propagateAttributionToLeadRow(
        admin,
        leadId,
        {
          ab_variant: parsed.ab_variant,
          persona: parsed.persona,
          ordering_method: parsed.ordering_method,
          lead_score: parsed.lead_score,
        },
        { email, name: parsed.name, phone: parsed.phone },
      );
    }

    if (eventName === 'calculator_completed' && !leadId && sessionId) {
      const { data: existing } = await admin
        .from('abandoned_calc_leads')
        .select('event_count, calculator_output')
        .eq('session_id', sessionId)
        .maybeSingle();

      const calcOutput = calculatorOutputFromMeta(meta as Record<string, unknown>);
      const priorOutput =
        typeof existing?.calculator_output === 'object' && existing.calculator_output !== null
          ? (existing.calculator_output as Record<string, string>)
          : {};
      const mergedOutput = { ...priorOutput, ...calcOutput };

      const { error: abandonErr } = await admin
        .from('abandoned_calc_leads')
        .upsert(
          {
            email: email || null,
            name: parsed.name,
            phone: parsed.phone,
            session_id: sessionId,
            lead_source: source,
            event_count: (typeof existing?.event_count === 'number' ? existing.event_count : 0) + 1,
            last_event_at: new Date().toISOString(),
            calculator_output: Object.keys(mergedOutput).length > 0 ? mergedOutput : {},
          },
          { onConflict: 'session_id' },
        );

      if (abandonErr) {
        console.error('[ingest-lead-event] abandoned_calc_leads upsert failed:', abandonErr.message);
        throw abandonErr;
      }
    }

    return new Response(
      JSON.stringify({ success: true, lead_event_id: inserted?.id ?? null }),
      { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'unknown error');
    console.error('[ingest-lead-event]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
