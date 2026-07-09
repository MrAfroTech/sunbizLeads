import { createAdminClient } from '../_shared/supabase-admin.ts';
import { requireEnv } from '../_shared/env.ts';

const corsHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-max-age': '86400',
};

const EVENT_SCORES: Record<string, number> = {
  calculator_completed: 10,
  phone_provided: 20,
  repeat_visit: 5,
  multi_tool_engagement: 15,
  calculator_viewed: 2,
  cta_clicked: 8,
};

function tierFromScore(score: number): string {
  if (score >= 60) return 'HOT';
  if (score >= 30) return 'WARM';
  return 'COLD';
}

function authorizeServiceRole(req: Request): boolean {
  const expected = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token === expected;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  if (!authorizeServiceRole(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const leadId = typeof body.lead_id === 'string' ? body.lead_id.trim() : '';
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'lead_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const admin = createAdminClient();

    const { data: leadRow, error: leadErr } = await admin
      .from('scan_and_scale_click_events')
      .select('id, event_count')
      .eq('id', leadId)
      .maybeSingle();

    if (leadErr) throw leadErr;
    if (!leadRow) {
      return new Response(JSON.stringify({ error: 'lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const { data: events, error: eventsErr } = await admin
      .from('lead_events')
      .select('event_name, source')
      .eq('lead_id', leadId);

    if (eventsErr) throw eventsErr;

    let total = 0;
    const seenEvents = new Set<string>();

    for (const row of events ?? []) {
      const name = typeof row.event_name === 'string' ? row.event_name : '';
      if (!name || seenEvents.has(name)) continue;
      seenEvents.add(name);
      total += EVENT_SCORES[name] ?? 0;
    }

    const sources = new Set(
      (events ?? [])
        .map((row) => (typeof row.source === 'string' ? row.source.trim() : ''))
        .filter(Boolean),
    );
    if (sources.size >= 2 && !seenEvents.has('multi_tool_engagement')) {
      total += EVENT_SCORES.multi_tool_engagement;
    }

    const eventCount = typeof leadRow.event_count === 'number' ? leadRow.event_count : 0;
    if (eventCount >= 3) {
      total = Math.floor(total * 1.25);
    }

    const intentTier = tierFromScore(total);

    const { error: updateErr } = await admin
      .from('scan_and_scale_click_events')
      .update({
        intent_score: total,
        intent_tier: intentTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({ lead_id: leadId, intent_score: total, intent_tier: intentTier }),
      { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'unknown error');
    console.error('[score-lead]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
