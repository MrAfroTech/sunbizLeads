import { createAdminClient } from '../_shared/supabase-admin.ts';
import {
  enrichProspectProfile,
  enrichmentDailyCreditCap,
  enrichmentPriorityThreshold,
  isPocSeniority,
  matchProspect,
} from '../_shared/explorium.ts';
import { requireEnv } from '../_shared/env.ts';

const corsHeaders: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-max-age': '86400',
};

const BATCH_LIMIT = 10;

type LeadPriorityRow = {
  email: string;
  domain: string;
  full_name: string | null;
  company_name: string | null;
  cluster_size: number | null;
  priority_score: number | null;
};

function authorizeServiceRole(req: Request): boolean {
  const expected = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token === expected;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function incrementDailyCredits(admin: ReturnType<typeof createAdminClient>, count: number) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await admin
    .from('enrichment_daily_usage')
    .select('credits_used')
    .eq('usage_date', today)
    .maybeSingle();

  const next = (row?.credits_used ?? 0) + count;
  await admin.from('enrichment_daily_usage').upsert(
    { usage_date: today, credits_used: next },
    { onConflict: 'usage_date' },
  );
  return next;
}

async function overDailyCap(admin: ReturnType<typeof createAdminClient>): Promise<boolean> {
  const cap = enrichmentDailyCreditCap();
  if (cap === null) return false;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from('enrichment_daily_usage')
    .select('credits_used')
    .eq('usage_date', today)
    .maybeSingle();
  return (data?.credits_used ?? 0) >= cap;
}

function meetsEnrichmentThreshold(row: LeadPriorityRow): boolean {
  const clusterSize = row.cluster_size ?? 0;
  const score = Number(row.priority_score ?? 0);
  return clusterSize >= 3 || score >= enrichmentPriorityThreshold();
}

async function fetchLeadRow(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<LeadPriorityRow | null> {
  const { data, error } = await admin
    .from('v_lead_priority')
    .select('email, domain, full_name, company_name, cluster_size, priority_score')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data as LeadPriorityRow | null;
}

async function maybeAssignClusterPoc(
  admin: ReturnType<typeof createAdminClient>,
  row: LeadPriorityRow,
  profile: { seniority_level?: string },
) {
  const clusterSize = row.cluster_size ?? 0;
  if (clusterSize < 3 || !isPocSeniority(profile.seniority_level)) return;

  await admin.from('account_cluster_poc').upsert(
    {
      domain: row.domain,
      poc_email: row.email,
      source: 'explorium',
      assigned_at: new Date().toISOString(),
    },
    { onConflict: 'domain' },
  );
}

async function enrichOneEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<{ email: string; status: string; reason?: string }> {
  const normalized = normalizeEmail(email);

  const { data: existing } = await admin
    .from('enriched_contacts')
    .select('lead_email')
    .eq('lead_email', normalized)
    .maybeSingle();
  if (existing) {
    return { email: normalized, status: 'skipped', reason: 'already_enriched' };
  }

  if (await overDailyCap(admin)) {
    return { email: normalized, status: 'skipped', reason: 'daily_cap_reached' };
  }

  const leadRow = await fetchLeadRow(admin, normalized);
  if (!leadRow) {
    return { email: normalized, status: 'skipped', reason: 'not_in_view' };
  }

  if (!meetsEnrichmentThreshold(leadRow)) {
    return { email: normalized, status: 'skipped', reason: 'below_threshold' };
  }

  const prospectId = await matchProspect({
    email: normalized,
    full_name: leadRow.full_name ?? undefined,
    company_name: leadRow.company_name ?? undefined,
  });

  if (!prospectId) {
    return { email: normalized, status: 'skipped', reason: 'no_prospect_match' };
  }

  const profile = await enrichProspectProfile(prospectId);
  await incrementDailyCredits(admin, 2);

  const { error: insertErr } = await admin.from('enriched_contacts').insert({
    lead_email: normalized,
    prospect_id: profile.prospect_id,
    full_name: profile.full_name ?? leadRow.full_name,
    job_title: profile.job_title,
    seniority_level: profile.seniority_level,
    linkedin_url: profile.linkedin_url,
    company_name: profile.company_name ?? leadRow.company_name,
    enriched_at: new Date().toISOString(),
  });
  if (insertErr) throw insertErr;

  await maybeAssignClusterPoc(admin, leadRow, profile);

  return { email: normalized, status: 'completed' };
}

async function processQueue(admin: ReturnType<typeof createAdminClient>) {
  const { data: pending, error } = await admin
    .from('lead_enrichment_queue')
    .select('email')
    .eq('status', 'pending')
    .order('queued_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) throw error;

  const results = [];
  for (const row of pending ?? []) {
    const email = normalizeEmail(row.email);
    await admin
      .from('lead_enrichment_queue')
      .update({ status: 'processing' })
      .eq('email', email);

    try {
      const result = await enrichOneEmail(admin, email);
      await admin
        .from('lead_enrichment_queue')
        .update({
          status: result.status === 'completed' ? 'completed' : 'skipped',
          processed_at: new Date().toISOString(),
          error: result.reason ?? null,
        })
        .eq('email', email);
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await admin
        .from('lead_enrichment_queue')
        .update({ status: 'failed', processed_at: new Date().toISOString(), error: message })
        .eq('email', email);
      results.push({ email, status: 'failed', reason: message });
    }
  }

  return results;
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
    const body = await req.json().catch(() => ({}));
    const admin = createAdminClient();

    if (body.process_queue === true) {
      const results = await processQueue(admin);
      return new Response(JSON.stringify({ ok: true, results }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    if (!email) {
      return new Response(JSON.stringify({ error: 'email or process_queue required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const result = await enrichOneEmail(admin, email);
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
