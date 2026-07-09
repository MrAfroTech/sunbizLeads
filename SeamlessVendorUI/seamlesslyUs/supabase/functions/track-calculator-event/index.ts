import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-max-age': '86400',
};

function coerceText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function coerceScrollDepth(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function coerceLeadScore(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function coerceVariant(value: unknown): string | null {
  const text = coerceText(value)?.toLowerCase();
  if (text === 'a' || text === 'b') return text;
  return null;
}

function coerceEmail(value: unknown): string | null {
  const text = coerceText(value);
  return text ? text.toLowerCase() : null;
}

function coerceDecimal(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function createAdminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const sessionId =
      coerceText(body.session_id) ?? crypto.randomUUID();
    const eventType = coerceText(body.event_type);

    if (!eventType) {
      return new Response(
        JSON.stringify({ error: 'event_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    const admin = createAdminClient();
    const phone =
      coerceText(body.phone_number) ?? coerceText(body.phone);

    const { error } = await admin.from('calculator_engagement_events').insert({
      session_id: sessionId,
      event_type: eventType,
      scroll_depth: coerceScrollDepth(body.scroll_depth),
      page: coerceText(body.page),
      referrer: coerceText(body.referrer),
      calculator_name: coerceText(body.calculator_name),
      first_name: coerceText(body.first_name),
      last_name: coerceText(body.last_name),
      name: coerceText(body.name),
      email: coerceEmail(body.email),
      phone,
      phone_number: phone,
      venue_name: coerceText(body.venue_name),
      ab_variant: coerceVariant(body.ab_variant),
      persona: coerceText(body.persona),
      ordering_method: coerceText(body.ordering_method),
      peak_night_customers: coerceDecimal(body.peak_night_customers),
      average_spend_per_customer: coerceDecimal(body.average_spend_per_customer),
      lead_score: coerceLeadScore(body.lead_score),
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, session_id: sessionId }), {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err ?? 'unknown error');
    console.error('[track-calculator-event]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
