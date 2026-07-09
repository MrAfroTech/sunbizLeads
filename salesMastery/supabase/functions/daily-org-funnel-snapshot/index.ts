import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers':
    'authorization, x-client-info, apikey, content-type',
  'access-control-max-age': '86400',
};

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function utcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const admin = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    );

    const { data: scores, error: scoresError } = await admin
      .from('org_funnel_scores')
      .select(
        'domain, company_name, unique_emails, visit_count, has_phone, phone_provided_count, completed_calculator, clicked_cta, reached_email_sequence, multi_person, funnel_score, priority_tier, last_seen',
      );

    if (scoresError) throw scoresError;

    const snapshotDate = utcDateString();
    const rows = (scores ?? []).map((row) => ({
      snapshot_date: snapshotDate,
      domain: row.domain,
      company_name: row.company_name,
      unique_emails: row.unique_emails,
      visit_count: row.visit_count,
      has_phone: row.has_phone,
      phone_provided_count: row.phone_provided_count,
      completed_calculator: row.completed_calculator,
      clicked_cta: row.clicked_cta,
      reached_email_sequence: row.reached_email_sequence,
      multi_person: row.multi_person,
      funnel_score: row.funnel_score,
      priority_tier: row.priority_tier,
      last_seen: row.last_seen,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await admin
        .from('org_funnel_snapshots')
        .insert(rows);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, orgs_snapshotted: rows.length }),
      {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
